/**
 * Service để quản lý logic AI tư vấn và khảo sát trang trại
 * Tách biệt logic business ra khỏi components để dễ quản lý và bảo trì
 */

import { getFarmOverviewAI, type FarmOverviewRequest } from "@/api/aiSurvey";
import { submitSurveyResponse, type SurveyResponseRequest } from "@/api/survey";
import type { FarmProfile } from "@/api/farm";
import type { SurveyResponseItem } from "@/api/survey";
import type { SoilData } from "@/api/co2";

/**
 * Chuẩn bị dữ liệu để gửi cho AI tư vấn
 */
export const prepareAIAdvisoryData = (
  farm: FarmProfile | null,
  surveyResponses: SurveyResponseItem[],
  soilData: SoilData | null
): FarmOverviewRequest | null => {
  if (!farm) return null;

  return {
    farmId: farm.id ?? 0,
    farmName: farm.farmName,
    farmSizeHectares: farm.farmSizeHectares ?? 0,
    address: farm.address
      ? [
          farm.address.locationAddress,
          farm.address.commune,
          farm.address.district,
          farm.address.province,
        ]
        .filter(Boolean)
        .join(", ")
      : undefined,
    crops: farm.crops?.map((crop) => ({
      cropName: crop.cropName,
      plantingDate: crop.plantingDate,
      plantingMethod: crop.plantingMethod,
      cropType: crop.cropType,
      farmingType: crop.farmingType,
    })),
    surveyResponses: surveyResponses.map((response) => ({
      questionId: response.questionId,
      textAnswer: response.textAnswer,
    })),
    soilData: soilData
      ? {
          sandLayers: soilData.sandLayers,
          siltLayers: soilData.siltLayers,
          clayLayers: soilData.clayLayers,
          phLayers: soilData.phLayers,
        }
      : undefined,
  };
};

/**
 * Gọi AI để tư vấn tổng quan về trang trại
 * Sử dụng env variable VITE_API_AI_SURVEY
 */
export const fetchFarmAIAdvisory = async (
  farm: FarmProfile | null,
  surveyResponses: SurveyResponseItem[],
  soilData: SoilData | null
) => {
  const requestData = prepareAIAdvisoryData(farm, surveyResponses, soilData);

  if (!requestData) {
    throw new Error("Không có dữ liệu trang trại để phân tích");
  }

  const response = await getFarmOverviewAI(requestData);

  if (!response.status) {
    const errorMessage =
      (response.errors || []).join("\n") ||
      "Không thể nhận được tư vấn từ AI. Vui lòng thử lại sau.";
    throw new Error(errorMessage);
  }

  return response.data || response.message || "Không có dữ liệu phản hồi";
};

/**
 * Gửi khảo sát mới cho trang trại
 * API sẽ tự động xóa khảo sát cũ và lưu bản mới nhất
 */
export const submitFarmSurvey = async (
  farmId: number,
  answers: Array<{ questionId: number; textAnswer: string }>
) => {
  const requestData: SurveyResponseRequest = {
    farmProfileId: farmId,
    answers,
  };

  const response = await submitSurveyResponse(requestData);

  if (!response.status) {
    const errorMessage =
      (response.errors || []).join("\n") || "Không thể gửi khảo sát";
    throw new Error(errorMessage);
  }

  return response;
};

/**
 * Kiểm tra xem có thể sử dụng AI tư vấn không
 * (Cần có ít nhất một khảo sát đã được hoàn thành)
 */
export const canUseAIAdvisory = (surveyResponses: SurveyResponseItem[]): boolean => {
  return surveyResponses.length > 0;
};

