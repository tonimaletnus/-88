import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
// Initialize safe AI instance. 
// Note: In a real app, you should handle missing keys gracefully in UI, 
// but for this structure we assume env is set or we catch errors.
const ai = new GoogleGenAI({ apiKey });

export const checkFormat = async (text: string): Promise<string> => {
  if (!apiKey) return "API Key not configured. Unable to perform AI format check.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一位专业的社会学学术编辑。请对学生提交的以下社会调查报告文本进行严格的学术格式与逻辑审查。
请务必使用中文输出，并严格按照以下标准格式返回分析报告（请不要使用 Markdown 代码块符号，保持纯文本段落格式以便前端渲染）：

【总体评价】
(在此处简要评价文本的完整度与学术性，并给出 0-100 的预估评分)

【格式规范性检查】
• 学术语调：(分析是否使用了客观、正式的书面语，是否存在口语化表达)
• 标点与排版：(分析标点符号使用是否规范，是否存在错别字)
• 关键要素：(检查是否包含调查背景、方法、结果等必要环节)

【逻辑与内容分析】
(在此处分析文本的逻辑连贯性，论述是否清晰，论据是否充分支持论点)

【具体修改建议】
1. (给出第1条具体建议)
2. (给出第2条具体建议)
3. (给出第3条具体建议)

待分析文本：
"${text}"`,
    });
    return response.text || "未能生成分析报告。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 分析服务暂时不可用，请稍后再试或检查网络连接。";
  }
};

export const generateTeachingInsight = async (topic: string): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a short, 2-sentence pedagogical insight for a teacher regarding student performance in: ${topic}`,
    });
    return response.text || "No insight available.";
  } catch (error) {
    return "Could not generate insight.";
  }
};