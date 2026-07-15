export enum AiPromptTypeEnum {
  /** System-промпт validation для украшений на шею */
  TRY_ON_VALIDATION_SYSTEM_NECKLACE = 'TRY_ON_VALIDATION_SYSTEM_NECKLACE',
  /** System-промпт validation для серёг */
  TRY_ON_VALIDATION_SYSTEM_EARRING = 'TRY_ON_VALIDATION_SYSTEM_EARRING',
  /** User-промпт validation (контекст товара + изображения) */
  TRY_ON_VALIDATION_USER = 'TRY_ON_VALIDATION_USER',
  /** Generation-промпт для колье / чокеров */
  TRY_ON_GENERATION_NECKLACE = 'TRY_ON_GENERATION_NECKLACE',
  /** Generation-промпт для серёг */
  TRY_ON_GENERATION_EARRING = 'TRY_ON_GENERATION_EARRING',
}
