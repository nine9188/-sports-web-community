'use client'

import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, Upload } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button, Container, ContainerContent } from '@/shared/components/ui'
import { getSupabaseBrowser } from '@/shared/lib/supabase/client.browser'
import { useSubmitPack, useCheckPackName } from '@/domains/shop/hooks/useEmoticonStudio'
import {
  EMOTICON_CATEGORIES,
  PRICE_OPTIONS,
  SUBMISSION_LIMITS,
  type EmoticonCategory,
} from '@/domains/shop/types/emoticon-submission'

export default function SubmitForm() {
  const [packName, setPackName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<EmoticonCategory>('general')
  const [tags, setTags] = useState('')
  const [price, setPrice] = useState(0)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [emoticonFiles, setEmoticonFiles] = useState<File[]>([])
  const [emoticonPreviews, setEmoticonPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const emoticonInputRef = useRef<HTMLInputElement>(null)

  const submitMutation = useSubmitPack()
  const { data: isDuplicate, isFetching: isCheckingName } = useCheckPackName(packName)

  const validateImage = useCallback((file: File): string | null => {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      return 'PNG 또는 JPG 파일만 가능합니다.'
    }
    if (file.size > SUBMISSION_LIMITS.IMAGE_MAX_SIZE) {
      return '파일 크기는 500KB 이하여야 합니다.'
    }
    return null
  }, [])

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const error = validateImage(file)
    if (error) { toast.error(error); return }
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleEmoticonAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = SUBMISSION_LIMITS.EMOTICON_MAX - emoticonFiles.length
    if (files.length > remaining) {
      toast.error(`최대 ${SUBMISSION_LIMITS.EMOTICON_MAX}개까지 등록 가능합니다.`)
      return
    }
    for (const file of files) {
      const error = validateImage(file)
      if (error) { toast.error(`${file.name}: ${error}`); return }
    }
    setEmoticonFiles(prev => [...prev, ...files])
    setEmoticonPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    if (e.target) e.target.value = ''
  }

  const removeEmoticon = (index: number) => {
    setEmoticonFiles(prev => prev.filter((_, i) => i !== index))
    setEmoticonPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    // 검증
    if (!packName.trim()) { toast.error('팩 이름을 입력해주세요.'); return }
    if (isDuplicate) { toast.error('이미 사용 중인 팩 이름입니다.'); return }
    if (!thumbnailFile) { toast.error('대표 이미지를 업로드해주세요.'); return }
    if (emoticonFiles.length < SUBMISSION_LIMITS.EMOTICON_MIN) {
      toast.error(`이모티콘을 최소 ${SUBMISSION_LIMITS.EMOTICON_MIN}개 등록해주세요.`)
      return
    }
    if (description.trim().length < SUBMISSION_LIMITS.DESCRIPTION_MIN) {
      toast.error(`설명을 ${SUBMISSION_LIMITS.DESCRIPTION_MIN}자 이상 입력해주세요.`)
      return
    }

    setIsUploading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('로그인이 필요합니다.'); return }

      const timestamp = Date.now()
      const basePath = `${user.id}/${timestamp}`

      // 썸네일 업로드
      const thumbExt = thumbnailFile.name.split('.').pop()
      const thumbPath = `${basePath}/thumbnail.${thumbExt}`
      const { error: thumbError } = await supabase.storage
        .from('emoticon-submissions')
        .upload(thumbPath, thumbnailFile)
      if (thumbError) throw new Error('썸네일 업로드 실패')

      const { data: thumbUrl } = supabase.storage
        .from('emoticon-submissions')
        .getPublicUrl(thumbPath)

      // 이모티콘 업로드
      const emoticonUrls: string[] = []
      for (let i = 0; i < emoticonFiles.length; i++) {
        const file = emoticonFiles[i]
        const ext = file.name.split('.').pop()
        const path = `${basePath}/emoticon_${i + 1}.${ext}`
        const { error } = await supabase.storage
          .from('emoticon-submissions')
          .upload(path, file)
        if (error) throw new Error(`이모티콘 ${i + 1} 업로드 실패`)

        const { data: url } = supabase.storage
          .from('emoticon-submissions')
          .getPublicUrl(path)
        emoticonUrls.push(url.publicUrl)
      }

      // 서버 액션으로 신청 제출
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, SUBMISSION_LIMITS.TAGS_MAX)

      const result = await submitMutation.mutateAsync({
        packName: packName.trim(),
        description: description.trim(),
        category,
        tags: tagArray,
        thumbnailPath: thumbUrl.publicUrl,
        emoticonPaths: emoticonUrls,
        requestedPrice: price,
      })

      if (result.success) {
        toast.success('이모티콘 팩 신청이 완료되었습니다!')
        // 폼 초기화
        setPackName('')
        setDescription('')
        setCategory('general')
        setTags('')
        setPrice(0)
        setThumbnailFile(null)
        setThumbnailPreview(null)
        setEmoticonFiles([])
        setEmoticonPreviews([])
      } else {
        toast.error(result.error ?? '신청에 실패했습니다.')
      }
    } catch (error) {
      console.error('이모티콘 신청 오류:', error)
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerContent className="px-4 py-4 space-y-4">
        {/* 팩 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-1">팩 이름</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={packName}
              onChange={e => setPackName(e.target.value)}
              maxLength={SUBMISSION_LIMITS.PACK_NAME_MAX}
              placeholder={`${SUBMISSION_LIMITS.PACK_NAME_MIN}~${SUBMISSION_LIMITS.PACK_NAME_MAX}자`}
              className="flex-1 px-3 py-2 text-sm border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg outline-none focus:outline-none hover:bg-[#F5F5F5] dark:hover:bg-[#262626] focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
            />
          </div>
          {packName.trim().length >= 2 && (
            <p className={`text-xs mt-1 ${isCheckingName ? 'text-gray-400' : isDuplicate ? 'text-red-500' : 'text-green-500'}`}>
              {isCheckingName ? '확인 중...' : isDuplicate ? '이미 사용 중인 이름입니다.' : '사용 가능한 이름입니다.'}
            </p>
          )}
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-1">카테고리</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as EmoticonCategory)}
            className="w-full px-3 py-2 text-sm border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg outline-none"
          >
            {EMOTICON_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* 대표 이미지 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-1">대표 이미지</label>
          <div className="flex items-center gap-3">
            {thumbnailPreview ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-black/7 dark:border-white/10">
                <Image src={thumbnailPreview} alt="thumbnail" fill className="object-contain" />
                <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(null) }}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 rounded-full">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border border-dashed border-black/20 dark:border-white/20 flex items-center justify-center hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">200x200, PNG/JPG, 500KB 이하</p>
          </div>
          <input ref={thumbnailInputRef} type="file" accept="image/png,image/jpeg" onChange={handleThumbnailChange} className="hidden" />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-1">설명</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={SUBMISSION_LIMITS.DESCRIPTION_MAX}
            rows={3}
            placeholder={`${SUBMISSION_LIMITS.DESCRIPTION_MIN}~${SUBMISSION_LIMITS.DESCRIPTION_MAX}자`}
            className="w-full px-3 py-2 text-sm border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg outline-none resize-none hover:bg-[#F5F5F5] dark:hover:bg-[#262626] focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
          />
          <p className="text-xs text-gray-400 mt-0.5 text-right">{description.length}/{SUBMISSION_LIMITS.DESCRIPTION_MAX}</p>
        </div>

        {/* 희망 가격 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-1">희망 가격</label>
          <div className="flex items-center gap-1 p-2 rounded-lg border border-black/7 dark:border-white/10">
            {PRICE_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                type="button"
                variant="ghost"
                onClick={() => setPrice(opt.value)}
                className={`px-3 py-1.5 h-auto text-xs sm:text-sm font-medium ${
                  price === opt.value ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
                }`}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 이모티콘 등록 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
              이모티콘 ({emoticonFiles.length}/{SUBMISSION_LIMITS.EMOTICON_MAX})
            </label>
            <p className="text-xs text-gray-400">최소 {SUBMISSION_LIMITS.EMOTICON_MIN}개</p>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {emoticonPreviews.map((preview, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-black/7 dark:border-white/10">
                <Image src={preview} alt={`emoticon ${i + 1}`} fill className="object-contain p-1" />
                <button type="button" onClick={() => removeEmoticon(i)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 rounded-full">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {emoticonFiles.length < SUBMISSION_LIMITS.EMOTICON_MAX && (
              <button type="button" onClick={() => emoticonInputRef.current?.click()}
                className="aspect-square rounded-lg border border-dashed border-black/20 dark:border-white/20 flex items-center justify-center hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors">
                <Upload className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <input ref={emoticonInputRef} type="file" accept="image/png,image/jpeg" multiple onChange={handleEmoticonAdd} className="hidden" />
        </div>

        {/* 태그 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-1">태그</label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="쉼표로 구분, 최대 5개 (예: 페페, 개구리, 밈)"
            className="w-full px-3 py-2 text-sm border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg outline-none hover:bg-[#F5F5F5] dark:hover:bg-[#262626] focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
          />
        </div>

        {/* 안내사항 */}
        <div className="rounded-lg bg-[#F5F5F5] dark:bg-[#262626] px-3 py-2.5">
          <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 space-y-0.5">
            · 음란물을 이모티콘으로 등록하는 경우 사이버수사대에 즉각 신고합니다.<br />
            · 저작권을 위반한 이미지는 별도 통보 없이 판매중지될 수 있습니다.<br />
            · 검수는 평일 기준으로 진행됩니다.<br />
            · 하루 최대 {SUBMISSION_LIMITS.DAILY_MAX}건까지 신청할 수 있습니다.
          </p>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="primary" onClick={handleSubmit}
            disabled={isUploading || submitMutation.isPending}
            className="px-6 h-10">
            {isUploading || submitMutation.isPending ? '처리 중...' : '신청하기'}
          </Button>
        </div>
      </ContainerContent>
    </Container>
  )
}
