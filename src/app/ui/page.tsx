'use client';

import { useState } from 'react';
import { X, Inbox, AlertCircle, Check, Info, ChevronDown, User } from 'lucide-react';
import { toast } from 'react-toastify';
import Spinner from '@/shared/components/Spinner';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { Tabs, TabButton } from '@/shared/components/ui/tabs';

export default function UIShowcasePage() {
  const [activeTab, setActiveTab] = useState('colors');
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [demoTab, setDemoTab] = useState(0);
  const [toggleOn, setToggleOn] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  const tabs = [
    { id: 'colors', label: '색상' },
    { id: 'buttons', label: '버튼' },
    { id: 'inputs', label: '입력' },
    { id: 'forms', label: '폼' },
    { id: 'badges', label: '뱃지' },
    { id: 'cards', label: '카드' },
    { id: 'interactive', label: '인터랙티브' },
    { id: 'tables', label: '테이블' },
    { id: 'states', label: '상태' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#121212] py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">
            UI 디자인 시스템
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            프로젝트에서 사용하는 모든 UI 컴포넌트
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-800 dark:bg-[#3F3F3F] text-white'
                  : 'bg-white dark:bg-[#1D1D1D] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Colors */}
          {activeTab === 'colors' && (
            <>
              <Section title="배경색">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorBox
                    name="bg-primary"
                    className="bg-white dark:bg-[#1D1D1D]"
                    code="bg-white dark:bg-[#1D1D1D]"
                  />
                  <ColorBox
                    name="bg-secondary"
                    className="bg-[#F5F5F5] dark:bg-[#262626]"
                    code="bg-[#F5F5F5] dark:bg-[#262626]"
                  />
                  <ColorBox
                    name="bg-tertiary"
                    className="bg-[#EAEAEA] dark:bg-[#333333]"
                    code="bg-[#EAEAEA] dark:bg-[#333333]"
                  />
                  <ColorBox
                    name="bg-button"
                    className="bg-slate-800 dark:bg-[#3F3F3F]"
                    code="bg-slate-800 dark:bg-[#3F3F3F]"
                    textWhite
                  />
                </div>
              </Section>

              <Section title="텍스트 색상">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
                    <p className="text-gray-900 dark:text-[#F0F0F0] font-medium">Primary</p>
                    <code className="text-xs text-gray-500">text-gray-900 dark:text-[#F0F0F0]</code>
                  </div>
                  <div className="p-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">Secondary</p>
                    <code className="text-xs text-gray-500">text-gray-700 dark:text-gray-300</code>
                  </div>
                  <div className="p-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Tertiary</p>
                    <code className="text-xs text-gray-500">text-gray-500 dark:text-gray-400</code>
                  </div>
                  <div className="p-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
                    <p className="text-orange-600 dark:text-orange-400 font-medium">Accent [5]</p>
                    <code className="text-xs text-gray-500">text-orange-600 dark:text-orange-400</code>
                  </div>
                </div>
              </Section>

              <Section title="상태 색상">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <p className="text-green-800 dark:text-green-400 font-medium">Success</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <p className="text-yellow-800 dark:text-yellow-400 font-medium">Warning</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <p className="text-red-800 dark:text-red-400 font-medium">Error</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <p className="text-blue-800 dark:text-blue-400 font-medium">Info</p>
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* Buttons */}
          {activeTab === 'buttons' && (
            <>
              <Section title="버튼 스타일">
                <div className="flex flex-wrap gap-4">
                  <button className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-4 py-2 rounded-md hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors">
                    Primary
                  </button>
                  <button className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] px-4 py-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                    Secondary
                  </button>
                  <button className="text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                    Ghost
                  </button>
                  <button className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors">
                    Danger
                  </button>
                </div>
              </Section>

              <Section title="버튼 크기">
                <div className="flex flex-wrap items-center gap-4">
                  <button className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-3 py-1 text-sm rounded hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors">
                    Small
                  </button>
                  <button className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-4 py-2 rounded-md hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors">
                    Medium
                  </button>
                  <button className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-6 py-3 text-lg rounded-lg hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors">
                    Large
                  </button>
                </div>
              </Section>

              <Section title="버튼 상태">
                <div className="flex flex-wrap gap-4">
                  <button disabled className="bg-[#EAEAEA] dark:bg-[#333333] text-gray-400 dark:text-gray-500 px-4 py-2 rounded-md cursor-not-allowed">
                    Disabled
                  </button>
                  <button disabled className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Spinner size="sm" />
                    Loading
                  </button>
                </div>
              </Section>
            </>
          )}

          {/* Inputs */}
          {activeTab === 'inputs' && (
            <>
              <Section title="Input">
                <div className="space-y-4 max-w-md">
                  <input
                    type="text"
                    placeholder="기본 입력"
                    className="w-full px-3 py-2 rounded-md border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-white/30 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="에러 상태"
                    className="w-full px-3 py-2 rounded-md border-2 border-red-500 dark:border-red-400 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="비활성"
                    disabled
                    className="w-full px-3 py-2 rounded-md border border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  />
                </div>
              </Section>

              <Section title="Select">
                <div className="max-w-md">
                  <select className="w-full px-3 py-2 rounded-md border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-white/30">
                    <option>옵션 1</option>
                    <option>옵션 2</option>
                    <option>옵션 3</option>
                  </select>
                </div>
              </Section>

              <Section title="Textarea">
                <div className="max-w-md">
                  <textarea
                    placeholder="내용을 입력하세요"
                    rows={4}
                    className="w-full px-3 py-2 rounded-md border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-white/30 resize-none"
                  />
                </div>
              </Section>
            </>
          )}

          {/* Forms */}
          {activeTab === 'forms' && (
            <>
              <Section title="Toggle / Switch">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setToggleOn(!toggleOn)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      toggleOn ? 'bg-slate-800 dark:bg-[#F0F0F0]' : 'bg-[#EAEAEA] dark:bg-[#333333]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                        toggleOn
                          ? 'translate-x-[22px] bg-white dark:bg-[#1D1D1D]'
                          : 'translate-x-0.5 bg-white dark:bg-[#1D1D1D]'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">
                    {toggleOn ? 'ON' : 'OFF'}
                  </span>
                </div>
              </Section>

              <Section title="Checkbox">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkboxChecked}
                      onChange={(e) => setCheckboxChecked(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-slate-800 dark:text-[#F0F0F0] focus:ring-slate-800 dark:focus:ring-white/30 bg-white dark:bg-[#1D1D1D]"
                    />
                    <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">기본 체크박스</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-slate-800 dark:text-[#F0F0F0] bg-white dark:bg-[#1D1D1D]"
                    />
                    <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">체크된 상태</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                    <input
                      type="checkbox"
                      disabled
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-[#F5F5F5] dark:bg-[#262626]"
                    />
                    <span className="text-sm text-gray-400 dark:text-gray-500">비활성 체크박스</span>
                  </label>
                </div>
              </Section>

              <Section title="Radio">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="demo-radio"
                      defaultChecked
                      className="w-4 h-4 border-gray-300 dark:border-gray-600 text-slate-800 dark:text-[#F0F0F0] focus:ring-slate-800 dark:focus:ring-white/30 bg-white dark:bg-[#1D1D1D]"
                    />
                    <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">옵션 1</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="demo-radio"
                      className="w-4 h-4 border-gray-300 dark:border-gray-600 text-slate-800 dark:text-[#F0F0F0] focus:ring-slate-800 dark:focus:ring-white/30 bg-white dark:bg-[#1D1D1D]"
                    />
                    <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">옵션 2</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="demo-radio"
                      className="w-4 h-4 border-gray-300 dark:border-gray-600 text-slate-800 dark:text-[#F0F0F0] focus:ring-slate-800 dark:focus:ring-white/30 bg-white dark:bg-[#1D1D1D]"
                    />
                    <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">옵션 3</span>
                  </label>
                </div>
              </Section>
            </>
          )}

          {/* Badges */}
          {activeTab === 'badges' && (
            <>
              <Section title="뱃지 스타일">
                <div className="flex flex-wrap gap-3">
                  <span className="px-2 py-0.5 text-xs rounded bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300">
                    Default
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    Success
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                    Warning
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                    Error
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                    Info
                  </span>
                </div>
              </Section>

              <Section title="승무패 (W/D/L)">
                <div className="flex gap-2">
                  <div className="w-6 h-6 flex items-center justify-center rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    W
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                    D
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                    L
                  </div>
                </div>
              </Section>

              <Section title="아바타">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* Cards */}
          {activeTab === 'cards' && (
            <>
              <Section title="Container">
                <Container>
                  <ContainerHeader>
                    <ContainerTitle>컨테이너 제목</ContainerTitle>
                  </ContainerHeader>
                  <div className="p-4">
                    <p className="text-gray-700 dark:text-gray-300">컨테이너 내용입니다.</p>
                  </div>
                </Container>
              </Section>

              <Section title="Modal">
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-4 py-2 rounded-md hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors"
                >
                  모달 열기
                </button>
              </Section>

              <Section title="Dropdown" allowOverflow>
                <div className="relative inline-block">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 px-4 py-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
                  >
                    메뉴
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full mt-1 w-48 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg shadow-lg overflow-hidden z-10">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]">
                        항목 1
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]">
                        항목 2
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]">
                        항목 3
                      </button>
                    </div>
                  )}
                </div>
              </Section>
            </>
          )}

          {/* Interactive */}
          {activeTab === 'interactive' && (
            <>
              <Section title="Tabs">
                <div className="space-y-6">
                  {/* Default Style */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Default (배경)</p>
                    <Tabs>
                      <TabButton active={demoTab === 0} onClick={() => setDemoTab(0)}>탭 1</TabButton>
                      <TabButton active={demoTab === 1} onClick={() => setDemoTab(1)}>탭 2</TabButton>
                      <TabButton active={demoTab === 2} onClick={() => setDemoTab(2)}>탭 3</TabButton>
                    </Tabs>
                  </div>
                  {/* Underline Style */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Underline (밑줄)</p>
                    <Tabs>
                      <TabButton variant="underline" active={demoTab === 0} onClick={() => setDemoTab(0)}>탭 1</TabButton>
                      <TabButton variant="underline" active={demoTab === 1} onClick={() => setDemoTab(1)}>탭 2</TabButton>
                      <TabButton variant="underline" active={demoTab === 2} onClick={() => setDemoTab(2)}>탭 3</TabButton>
                    </Tabs>
                  </div>
                  {/* Fill Style */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Fill (채움)</p>
                    <div className="max-w-xs">
                      <Tabs className="bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
                        <TabButton variant="fill" active={demoTab === 0} onClick={() => setDemoTab(0)} className="py-2">탭 1</TabButton>
                        <TabButton variant="fill" active={demoTab === 1} onClick={() => setDemoTab(1)} className="py-2">탭 2</TabButton>
                        <TabButton variant="fill" active={demoTab === 2} onClick={() => setDemoTab(2)} className="py-2">탭 3</TabButton>
                      </Tabs>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Toast">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => toast.success('저장되었습니다')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Success Toast
                  </button>
                  <button
                    onClick={() => toast.error('오류가 발생했습니다')}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    Error Toast
                  </button>
                  <button
                    onClick={() => toast.warning('주의가 필요합니다')}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors text-sm"
                  >
                    Warning Toast
                  </button>
                  <button
                    onClick={() => toast.info('참고 정보입니다')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Info Toast
                  </button>
                </div>
              </Section>

              <Section title="Tooltip">
                <div className="flex flex-wrap gap-6">
                  <div className="relative group">
                    <button className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-4 py-2 rounded-md hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors text-sm">
                      위에 표시
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-[#1D1D1D] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      위에 표시되는 툴팁
                    </div>
                  </div>
                  <div className="relative group">
                    <button className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-4 py-2 rounded-md hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors text-sm">
                      아래에 표시
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-[#1D1D1D] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      아래에 표시되는 툴팁
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Accordion">
                <div className="max-w-md space-y-2">
                  <div className="border border-black/7 dark:border-white/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setAccordionOpen(!accordionOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">아코디언 제목</span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${accordionOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {accordionOpen && (
                      <div className="px-4 py-3 bg-white dark:bg-[#1D1D1D]">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          아코디언 내용입니다. 클릭하면 펼쳐지고 다시 클릭하면 접힙니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              <Section title="Popover" allowOverflow>
                <div className="relative inline-block">
                  <button
                    onClick={() => setPopoverOpen(!popoverOpen)}
                    className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-4 py-2 rounded-md hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors text-sm"
                  >
                    Popover 열기
                  </button>
                  {popoverOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setPopoverOpen(false)} />
                      <div className="absolute top-full mt-2 left-0 w-64 p-4 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg shadow-lg z-20">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">Popover 제목</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Popover는 Dropdown보다 더 많은 콘텐츠를 담을 수 있습니다.
                        </p>
                        <button
                          onClick={() => setPopoverOpen(false)}
                          className="text-sm text-slate-800 dark:text-[#F0F0F0] font-medium hover:underline"
                        >
                          닫기
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Section>
            </>
          )}

          {/* Tables */}
          {activeTab === 'tables' && (
            <Section title="테이블">
              <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">제목</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">작성자</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">날짜</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">조회</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="border-b border-black/5 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-[#F0F0F0]">
                          게시글 제목 {i}
                          <span className="ml-1 text-xs text-orange-600 dark:text-orange-400">[5]</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">사용자{i}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">2026-01-18</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">123</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* States */}
          {activeTab === 'states' && (
            <>
              <Section title="Loading">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs text-gray-500">sm</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="md" />
                    <span className="text-xs text-gray-500">md</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="lg" />
                    <span className="text-xs text-gray-500">lg</span>
                  </div>
                </div>
              </Section>

              <Section title="Skeleton">
                <div className="space-y-4 max-w-md">
                  {/* Text Skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded animate-pulse w-full" />
                    <div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded animate-pulse w-5/6" />
                  </div>
                  {/* Card Skeleton */}
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
                    <div className="w-10 h-10 rounded-full bg-[#EAEAEA] dark:bg-[#333333] animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded animate-pulse w-1/2" />
                      <div className="h-3 bg-[#EAEAEA] dark:bg-[#333333] rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Empty State">
                <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 mb-4 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
                      <Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">데이터가 없습니다</p>
                    <button className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-4 py-2 rounded-md text-sm">
                      새로 만들기
                    </button>
                  </div>
                </div>
              </Section>

              <Section title="Alerts">
                <div className="space-y-3 max-w-md">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Check className="w-5 h-5 text-green-800 dark:text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-400">성공적으로 저장되었습니다.</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <AlertCircle className="w-5 h-5 text-yellow-800 dark:text-yellow-400 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">주의가 필요합니다.</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <X className="w-5 h-5 text-red-800 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-400">에러가 발생했습니다.</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Info className="w-5 h-5 text-blue-800 dark:text-blue-400 flex-shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-400">참고 정보입니다.</p>
                  </div>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#1D1D1D] rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">모달 제목</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-gray-700 dark:text-gray-300">모달 내용입니다.</p>
              </div>
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-black/5 dark:border-white/10">
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] px-4 py-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-800 dark:bg-[#3F3F3F] text-white px-4 py-2 rounded-md hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Section Component
function Section({ title, children, allowOverflow = false }: { title: string; children: React.ReactNode; allowOverflow?: boolean }) {
  return (
    <div className={`bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 ${allowOverflow ? '' : 'overflow-hidden'}`}>
      <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
        <h2 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ColorBox Component
function ColorBox({
  name,
  className,
  code,
  textWhite = false,
}: {
  name: string;
  className: string;
  code: string;
  textWhite?: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border border-black/7 dark:border-white/10 ${className}`}>
      <p className={`font-medium ${textWhite ? 'text-white' : 'text-gray-900 dark:text-[#F0F0F0]'}`}>
        {name}
      </p>
      <code className={`text-xs ${textWhite ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
        {code}
      </code>
    </div>
  );
}
