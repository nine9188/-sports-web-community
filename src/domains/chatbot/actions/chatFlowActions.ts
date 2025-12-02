'use server';

import { ChipType, ChipButton } from '../types';
import { CHIP_BUTTONS, getChipButton } from '../utils';
import { sendMessage } from './messageActions';

interface ChatFlowStep {
  type: 'message' | 'chips' | 'form';
  content?: string;
  chips?: string[];
  formConfig?: any;
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
        content: `${chip.label}이 필要하시군요? ${chip.description}`
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
      // Initial greeting or general response
      if (!userInput || userInput.trim() === '') {
        steps.push({
          type: 'message',
          content: '안녕하세요! 무엇을 도와드릴까요?'
        });
      } else {
        steps.push({
          type: 'message',
          content: '죄송합니다. 정확한 도움을 위해 아래 옵션 중 하나를 선택해주세요.'
        });
      }
      
      steps.push({
        type: 'chips',
        chips: CHIP_BUTTONS.map(chip => chip.label)
      });
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
  chipType: ChipType,
  formData: Record<string, any>
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