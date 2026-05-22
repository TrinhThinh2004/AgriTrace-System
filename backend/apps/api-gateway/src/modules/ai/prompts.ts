/**
 * Prompt templates tiếng Việt cho 3 workflow chính.
 * Tất cả prompt yêu cầu output dạng markdown ngắn gọn để FE render dễ.
 */

const COMMON_RULES = `
Trả lời bằng tiếng Việt, ngắn gọn (tối đa 300 từ), dạng markdown.
Tránh dùng tiêu đề lớn (h1/h2). Dùng list bullet và bold.
Kết thúc bằng dòng disclaimer: *"Gợi ý mang tính tham khảo, không thay thế chuyên gia nông nghiệp."*
`.trim();

function fmtDate(iso: string): string {
  if (!iso) return 'chưa có';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export interface BatchPlantingCtx {
  farm_name: string;
  farm_address: string;
  crop_category?: string;
  season_hint?: string;
  user_role?: string;
}

export function buildBatchPlantingPrompt(ctx: BatchPlantingCtx): string {
  const today = new Date().toLocaleDateString('vi-VN');
  const cropLine = ctx.crop_category
    ? `Cây trồng dự kiến: **${ctx.crop_category}** — xác nhận mùa vụ phù hợp và gợi ý lịch trồng/chăm sóc.`
    : 'Gợi ý 2-3 loại cây phù hợp với địa điểm và mùa hiện tại.';

  return `Bạn là chuyên gia nông nghiệp Việt Nam với 20 năm kinh nghiệm canh tác theo chuẩn VietGAP.

Thông tin trang trại:
- Tên: ${ctx.farm_name || '(chưa có)'}
- Địa chỉ: ${ctx.farm_address || '(chưa có)'}
- Mùa vụ định hướng: ${ctx.season_hint || 'không chỉ định'}
- Hôm nay: ${today}

Yêu cầu:
${cropLine}

Trả lời theo mẫu:
- **Cây trồng đề xuất**: ...
- **Mùa vụ phù hợp**: ngày trồng dự kiến, ngày thu hoạch ước tính
- **Lưu ý quan trọng**: 2-3 điểm về thời tiết, sâu bệnh hay gặp ở vùng này, yêu cầu VietGAP

${COMMON_RULES}`;
}

export interface ActivityHistoryItem {
  activity_type: string;
  performed_at: string;
  inputs_summary: string;
}

export interface ActivityLogCtx {
  batch_code: string;
  crop_category: string;
  activity_type: string;
  planting_date: string;
  current_status: string;
  recent_activities: ActivityHistoryItem[];
}

const ACTIVITY_LABEL: Record<string, string> = {
  SEEDING: 'Gieo trồng',
  FERTILIZING: 'Bón phân',
  SPRAYING: 'Phun thuốc',
  WATERING: 'Tưới nước',
  PRUNING: 'Cắt tỉa',
  HARVESTING: 'Thu hoạch',
  PACKING: 'Đóng gói',
  OTHER: 'Khác',
};

export function buildActivityLogPrompt(ctx: ActivityLogCtx): string {
  const action =
    ACTIVITY_LABEL[ctx.activity_type] || ctx.activity_type || 'hoạt động';
  const history =
    ctx.recent_activities.length > 0
      ? ctx.recent_activities
          .map(
            (a, i) =>
              `${i + 1}. ${ACTIVITY_LABEL[a.activity_type] || a.activity_type} (${fmtDate(a.performed_at)})${a.inputs_summary ? ` — ${a.inputs_summary}` : ''}`,
          )
          .join('\n')
      : '(chưa có hoạt động nào trước đó)';

  return `Bạn là chuyên gia VietGAP, hỗ trợ farmer ghi nhật ký điện tử đúng chuẩn.

Lô hàng:
- Mã: ${ctx.batch_code}
- Cây trồng: ${ctx.crop_category || '(chưa có)'}
- Ngày trồng: ${fmtDate(ctx.planting_date)}
- Trạng thái hiện tại: ${ctx.current_status || '(chưa rõ)'}

Lịch sử hoạt động gần đây:
${history}

Farmer đang định ghi nhận hoạt động: **${action}**.

Yêu cầu gợi ý:
- **Loại vật tư khuyến nghị** (tên cụ thể, ví dụ "Phân NPK 16-16-8")
- **Liều lượng tham khảo** (ví dụ "20–25 kg/sào")
- **Thời điểm tối ưu** trong ngày / giai đoạn cây
- **Cảnh báo** nếu có rủi ro: thuốc cấm theo VietGAP, sai mùa, gần ngày thu hoạch (thời gian cách ly)

${COMMON_RULES}`;
}

export interface InspectionSummaryCtx {
  batch_code: string;
  crop_category: string;
  farm_name: string;
  planting_date: string;
  harvest_date: string;
  current_status: string;
  all_activities: ActivityHistoryItem[];
}

export function buildInspectionSummaryPrompt(ctx: InspectionSummaryCtx): string {
  const activities =
    ctx.all_activities.length > 0
      ? ctx.all_activities
          .map(
            (a, i) =>
              `${i + 1}. ${fmtDate(a.performed_at)} — ${ACTIVITY_LABEL[a.activity_type] || a.activity_type}${a.inputs_summary ? `: ${a.inputs_summary}` : ''}`,
          )
          .join('\n')
      : '(không có nhật ký)';

  return `Bạn là kiểm định viên VietGAP. Phân tích lô hàng dưới đây để hỗ trợ inspector ra quyết định.

Thông tin lô:
- Mã: ${ctx.batch_code}
- Cây trồng: ${ctx.crop_category || '(chưa có)'}
- Trang trại: ${ctx.farm_name || '(chưa có)'}
- Trồng: ${fmtDate(ctx.planting_date)}
- Thu hoạch: ${fmtDate(ctx.harvest_date)}
- Trạng thái: ${ctx.current_status}

Toàn bộ nhật ký:
${activities}

Yêu cầu phân tích, trả về 3 phần:
- **Tuân thủ tiêu chuẩn VietGAP**: nhật ký có đầy đủ không, có bón phân/phun thuốc hợp lý không, có ghi thời gian cách ly trước thu hoạch không.
- **Bất thường cần lưu ý**: liệt kê các điểm nghi ngờ (vd: dùng thuốc cấm, liều cao bất thường, thiếu mốc quan trọng).
- **Khuyến nghị**: PASS / FAIL / CONDITIONAL_PASS kèm lý do ngắn 1-2 câu.

${COMMON_RULES}`;
}
