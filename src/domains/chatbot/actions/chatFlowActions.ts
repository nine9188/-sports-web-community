'use server';

import { ChipType, FormConfig, ChipButton } from '../types';
import { CHIP_BUTTONS, getChipButton } from '../utils';
import { sendMessage } from './messageActions';

interface ChatFlowStep {
  type: 'message' | 'chips' | 'form';
  content?: string;
  chips?: string[];
  formConfig?: FormConfig;
}

// Helper function to match user input with relevant buttons
function findRelevantButtons(userInput: string): ChipButton[] {
  const input = userInput.toLowerCase();
  const relevantButtons: ChipButton[] = [];

  // 키워드 매칭 맵
  const keywordMap: Record<string, string[]> = {
    'community_inquiry': ['문의', '질문', '이용', '사용', '방법', '어떻게', '계정', '가입', '로그인'],
    'community_terms': ['약관', '정책', '개인정보', '처리방침', '가이드라인', '규정', '이용약관'],
    'member_report': ['신고', '욕설', '비방', '스팸', '도배', '사칭', '사기', '부적절'],
    'opinion_submit': ['의견', '제안', '건의', '개선', '추가', '기능', '불편'],
    'post_delete_request': ['삭제', '지우기', '제거', '게시글', '댓글', '실수'],
    'bug_report': ['버그', '오류', '에러', '오작동', '안됨', '안돼', '느림', '느려', '작동']
  };

  // 각 버튼에 대해 키워드 매칭
  CHIP_BUTTONS.forEach(button => {
    const keywords = keywordMap[button.type] || [];
    const matches = keywords.some(keyword => input.includes(keyword));
    if (matches) {
      relevantButtons.push(button);
    }
  });

  return relevantButtons;
}

export async function getChatFlowResponse(
  conversationId: string,
  userInput: string,
  chipType?: ChipType
): Promise<{ success: boolean; steps?: ChatFlowStep[]; error?: string }> {
  try {
    const steps: ChatFlowStep[] = [];

    if (chipType) {
      const chip = getChipButton(chipType);
      if (!chip) {
        return { success: false, error: 'Invalid chip type' };
      }

      // Chip selection flow
      steps.push({
        type: 'message',
        content: `${chip.label}이 필요하시군요? ${chip.description}`
      });

      if (chip.form_config) {
        steps.push({
          type: 'form',
          formConfig: chip.form_config
        });
      }
    } else if (userInput.toLowerCase().includes('괜찮아요')) {
      // End conversation flow
      steps.push({
        type: 'message',
        content: '다른 문의사항이 있으면 새 대화를 이용해주세요.'
      });
    } else if (userInput.toLowerCase().includes('네 다른문의')) {
      // Continue with more inquiries
      steps.push({
        type: 'message',
        content: '더 도와드릴 내용이 있나요?'
      });

      steps.push({
        type: 'message',
        content: '무엇을 도와드릴까요?'
      });
    } else {
      // Smart response based on user input
      if (!userInput || userInput.trim() === '') {
        // Empty input - show greeting
        steps.push({
          type: 'message',
          content: '안녕하세요! 무엇을 도와드릴까요?'
        });

        steps.push({
          type: 'chips',
          chips: CHIP_BUTTONS.map(chip => chip.label)
        });
      } else {
        // User typed something - find relevant buttons
        const relevantButtons = findRelevantButtons(userInput);

        if (relevantButtons.length > 0) {
          // Found relevant buttons - show personalized response
          steps.push({
            type: 'message',
            content: `"${userInput}"에 대해 문의하셨네요! 아래 옵션이 도움이 될 수 있습니다.`
          });

          steps.push({
            type: 'chips',
            chips: relevantButtons.map(chip => chip.label)
          });
        } else {
          // No matching keywords - show all options
          steps.push({
            type: 'message',
            content: `"${userInput}"에 대한 문의를 남겨주셨습니다. 정확한 도움을 위해 아래 옵션 중 하나를 선택해주세요.`
          });

          steps.push({
            type: 'chips',
            chips: CHIP_BUTTONS.map(chip => chip.label)
          });
        }
      }
    }

    return { success: true, steps };
  } catch (error) {
    console.error('Error getting chat flow response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chat flow response'
    };
  }
}

export async function processChatFlow(
  conversationId: string,
  steps: ChatFlowStep[]
): Promise<{ success: boolean; error?: string }> {
  try {
    for (const step of steps) {
      if (step.type === 'message' && step.content) {
        await sendMessage(conversationId, step.content, 'bot');

        // Add delay to simulate typing
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else if (step.type === 'chips' && step.chips) {
        // Save chips as a message so they appear in the chat
        await sendMessage(
          conversationId,
          '', // Empty content
          'chips',
          undefined,
          { chips: step.chips } // Store chips in form_data
        );

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing chat flow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process chat flow'
    };
  }
}

export async function handleFormSubmission(
  conversationId: string,
  chipType: ChipType
): Promise<{ success: boolean; error?: string }> {
  try {
    const chip = getChipButton(chipType);
    if (!chip?.form_config) {
      return { success: false, error: 'Invalid form configuration' };
    }

    // Send confirmation message
    await sendMessage(
      conversationId, 
      chip.form_config.success_message, 
      'bot'
    );

    // Add delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ask if they need more help
    await sendMessage(
      conversationId,
      '더 도와드릴게 있을까요?',
      'bot'
    );

    return { success: true };
  } catch (error) {
    console.error('Error handling form submission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle form submission' 
    };
  }
}