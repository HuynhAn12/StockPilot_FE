// Nội dung các văn bản pháp lý công khai của StockPilot.
// Bản 1.0 soạn cho sản phẩm học thuật; cần luật sư rà soát và bổ sung thông tin doanh nghiệp trước khi thương mại hóa.

export const LEGAL_VERSION = '1.0';
export const LEGAL_EFFECTIVE_DATE = '22/10/2026';

export const OPERATOR = {
  name: 'Nhóm dự án StockPilot (C1SE.56), Trường Đại học Duy Tân',
  address: 'Thành phố Đà Nẵng, Việt Nam',
  businessRegistration: 'Chưa đăng ký kinh doanh (sản phẩm thuộc đồ án tốt nghiệp)',
  contact: 'Trang Hỗ trợ trong ứng dụng, hoặc biểu mẫu liên hệ trên trang chủ',
};

/**
 * Mỗi văn bản: { title, summary, sections: [{ heading, paragraphs?: string[], bullets?: string[] }] }.
 * Văn bản chỉ dẫn chiếu luật theo tên và số hiệu, không trích số điều để tránh dẫn sai khi luật được sửa đổi.
 */
export const LEGAL_DOCUMENTS = {
  'dieu-khoan-su-dung': {
    title: 'Điều khoản sử dụng dịch vụ',
    summary: 'Quy định quyền và nghĩa vụ giữa StockPilot và cửa hàng sử dụng phần mềm quản lý bán hàng, tồn kho.',
    sections: [
      {
        heading: '1. Giới thiệu và phạm vi áp dụng',
        paragraphs: [
          `StockPilot là phần mềm quản lý bán hàng, tồn kho và hỗ trợ ra quyết định, cung cấp dưới dạng dịch vụ trực tuyến (SaaS). Đơn vị vận hành: ${OPERATOR.name}, địa chỉ ${OPERATOR.address}.`,
          'Điều khoản này áp dụng cho mọi cá nhân, hộ kinh doanh và doanh nghiệp đăng ký tài khoản cửa hàng (gọi là "Cửa hàng") và người dùng do Cửa hàng tạo ra (chủ cửa hàng, nhân viên). Việc tích chọn đồng ý khi đăng ký là hình thức giao kết hợp đồng điện tử theo Luật Giao dịch điện tử số 20/2023/QH15.',
        ],
      },
      {
        heading: '2. Tài khoản và bảo mật đăng nhập',
        bullets: [
          'Cửa hàng cung cấp thông tin đăng ký chính xác và cập nhật khi thay đổi.',
          'Chủ cửa hàng chịu trách nhiệm về tài khoản nhân viên mình tạo ra và phân quyền cho họ.',
          'Không chia sẻ mật khẩu; thông báo ngay cho StockPilot qua trang Hỗ trợ khi nghi ngờ tài khoản bị truy cập trái phép.',
          'StockPilot có thể yêu cầu xác thực bằng mã OTP qua email hoặc số điện thoại để bảo vệ tài khoản.',
        ],
      },
      {
        heading: '3. Quyền sở hữu dữ liệu',
        paragraphs: [
          'Dữ liệu kinh doanh do Cửa hàng nhập vào (sản phẩm, tồn kho, đơn hàng, khách mua, giá vốn) thuộc quyền sở hữu của Cửa hàng. StockPilot chỉ xử lý dữ liệu này để cung cấp dịch vụ theo yêu cầu của Cửa hàng.',
          'Quản trị viên nền tảng không xem chi tiết đơn hàng, giá vốn hay doanh thu của từng Cửa hàng, trừ khi Cửa hàng yêu cầu hỗ trợ cụ thể hoặc cơ quan nhà nước có thẩm quyền yêu cầu theo quy định pháp luật.',
          'Cửa hàng có thể xuất dữ liệu của mình ra file bất cứ lúc nào trong thời gian sử dụng dịch vụ.',
        ],
      },
      {
        heading: '4. Trách nhiệm của Cửa hàng',
        bullets: [
          'Sử dụng dịch vụ cho hoạt động kinh doanh hợp pháp; không kinh doanh hàng cấm, hàng giả, hàng không rõ nguồn gốc.',
          'Tự chịu trách nhiệm về nghĩa vụ thuế, hóa đơn và kế toán của mình. StockPilot là công cụ quản lý, không thay thế phần mềm hóa đơn điện tử hoặc kế toán theo quy định.',
          'Khi lưu thông tin khách mua hàng, Cửa hàng là bên kiểm soát dữ liệu cá nhân và phải tuân thủ Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, bao gồm việc thông báo và xin sự đồng ý của khách hàng khi cần.',
          'Không tìm cách truy cập dữ liệu của cửa hàng khác, dò quét lỗ hổng, gây quá tải hoặc can thiệp vào hệ thống.',
        ],
      },
      {
        heading: '5. Thanh toán qua cổng PayOS',
        paragraphs: [
          'Tính năng nhận thanh toán bằng mã VietQR được cung cấp thông qua cổng PayOS theo tài khoản PayOS do chính Cửa hàng đăng ký. Tiền thanh toán chuyển thẳng vào tài khoản ngân hàng của Cửa hàng; StockPilot không giữ hộ tiền.',
          'Khóa kết nối PayOS được mã hóa trước khi lưu. Tranh chấp về giao dịch thanh toán được giải quyết giữa Cửa hàng, khách mua và PayOS theo điều khoản của PayOS.',
        ],
      },
      {
        heading: '6. Trợ lý AI và gợi ý giá',
        paragraphs: [
          'Cảnh báo tồn kho, gợi ý giá bán và câu trả lời của trợ lý AI được tạo tự động từ dữ liệu của Cửa hàng và chỉ mang tính tham khảo. Cửa hàng tự quyết định và chịu trách nhiệm về quyết định kinh doanh của mình.',
        ],
      },
      {
        heading: '7. Tạm ngừng và chấm dứt dịch vụ',
        bullets: [
          'StockPilot có thể tạm khóa Cửa hàng khi hết thời hạn sử dụng, vi phạm Điều khoản này, hoặc theo yêu cầu của cơ quan có thẩm quyền. Lý do tạm khóa được ghi nhận và thông báo cho Cửa hàng.',
          'Khi bị tạm khóa, dữ liệu Cửa hàng được giữ nguyên và khôi phục khi mở lại.',
          'Cửa hàng có thể yêu cầu chấm dứt dịch vụ và xóa dữ liệu qua trang Hỗ trợ. StockPilot xuất bản sao dữ liệu cho Cửa hàng nếu được yêu cầu trước khi xóa, trừ phần dữ liệu pháp luật buộc phải lưu trữ.',
        ],
      },
      {
        heading: '8. Giới hạn trách nhiệm',
        paragraphs: [
          'StockPilot nỗ lực duy trì dịch vụ ổn định và sao lưu dữ liệu định kỳ, nhưng không bảo đảm dịch vụ không bao giờ gián đoạn. StockPilot không chịu trách nhiệm về thiệt hại gián tiếp như mất lợi nhuận do gián đoạn ngoài tầm kiểm soát (thiên tai, sự cố hạ tầng của nhà cung cấp, tấn công mạng), trong phạm vi pháp luật cho phép.',
        ],
      },
      {
        heading: '9. Sửa đổi điều khoản',
        paragraphs: [
          'Khi sửa đổi Điều khoản, StockPilot thông báo trong ứng dụng ít nhất 7 ngày trước ngày có hiệu lực. Nếu không đồng ý, Cửa hàng có quyền ngừng sử dụng và yêu cầu xuất dữ liệu.',
        ],
      },
      {
        heading: '10. Luật áp dụng và giải quyết tranh chấp',
        paragraphs: [
          'Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp được ưu tiên giải quyết bằng thương lượng theo Quy chế hỗ trợ và giải quyết khiếu nại; nếu không thành, một trong hai bên có quyền yêu cầu Tòa án có thẩm quyền tại Việt Nam giải quyết.',
        ],
      },
    ],
  },

  'chinh-sach-bao-mat': {
    title: 'Chính sách bảo mật và bảo vệ dữ liệu cá nhân',
    summary: 'StockPilot thu thập dữ liệu cá nhân gì, dùng để làm gì, chia sẻ với ai và bạn có những quyền gì.',
    sections: [
      {
        heading: '1. Căn cứ pháp lý',
        paragraphs: [
          'Chính sách này được xây dựng theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực từ 01/01/2026), Nghị định 356/2025/NĐ-CP hướng dẫn thi hành, Luật Giao dịch điện tử số 20/2023/QH15, Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 và Luật Thương mại điện tử số 122/2025/QH15.',
        ],
      },
      {
        heading: '2. Vai trò của StockPilot',
        bullets: [
          'Với dữ liệu tài khoản của chủ cửa hàng và nhân viên (họ tên, email, số điện thoại), StockPilot là bên kiểm soát và xử lý dữ liệu cá nhân.',
          'Với dữ liệu khách mua hàng mà Cửa hàng lưu trong phần mềm, Cửa hàng là bên kiểm soát; StockPilot là bên xử lý dữ liệu, chỉ xử lý theo yêu cầu của Cửa hàng và không dùng cho mục đích riêng.',
        ],
      },
      {
        heading: '3. Dữ liệu chúng tôi thu thập',
        bullets: [
          'Thông tin tài khoản: họ tên, email, số điện thoại, mật khẩu (chỉ lưu dạng băm, không ai đọc được).',
          'Thông tin cửa hàng: tên, mã, địa chỉ, số điện thoại.',
          'Dữ liệu kỹ thuật: địa chỉ IP, loại trình duyệt, thời điểm đăng nhập, nhật ký thao tác nhạy cảm (khóa tài khoản, đổi giá, xuất dữ liệu) để bảo đảm an toàn và truy vết.',
          'Thông tin liên hệ bạn để lại trên trang chủ khi muốn được tư vấn.',
          'Nội dung bạn gửi trong yêu cầu hỗ trợ.',
          'StockPilot không thu thập dữ liệu cá nhân nhạy cảm (sức khỏe, sinh trắc học, tôn giáo, chính trị...) và không lưu số thẻ ngân hàng.',
        ],
      },
      {
        heading: '4. Mục đích xử lý',
        bullets: [
          'Tạo và quản lý tài khoản, xác thực đăng nhập, gửi mã OTP.',
          'Cung cấp các tính năng quản lý bán hàng, tồn kho, thanh toán, báo cáo và trợ lý AI.',
          'Hỗ trợ khách hàng, gửi thông báo về dịch vụ và thay đổi điều khoản.',
          'Bảo đảm an ninh hệ thống, phát hiện truy cập trái phép, đối soát khi có tranh chấp.',
          'Tuân thủ yêu cầu hợp pháp của cơ quan nhà nước có thẩm quyền.',
          'StockPilot không bán dữ liệu cá nhân và không dùng dữ liệu cho quảng cáo của bên thứ ba.',
        ],
      },
      {
        heading: '5. Bên thứ ba cùng xử lý dữ liệu',
        paragraphs: ['StockPilot chỉ chia sẻ phần dữ liệu cần thiết với các nhà cung cấp sau để vận hành dịch vụ:'],
        bullets: [
          'PayOS: xử lý thanh toán VietQR khi Cửa hàng bật tính năng này (mã đơn, số tiền, nội dung chuyển khoản).',
          'Dịch vụ email (Gmail SMTP của Google): gửi mã OTP và thông báo tới địa chỉ email của bạn.',
          'Nhà cung cấp SMS tại Việt Nam: gửi mã OTP tới số điện thoại khi bạn chọn nhận qua SMS.',
          'Cloudinary: lưu ảnh sản phẩm do Cửa hàng tải lên.',
          'Nhà cung cấp máy chủ và cơ sở dữ liệu đám mây nơi hệ thống được triển khai.',
          'Trợ lý AI của StockPilot hiện chạy trên máy chủ của StockPilot, không gửi dữ liệu cửa hàng tới dịch vụ AI bên ngoài. Nếu thay đổi, chính sách này sẽ được cập nhật trước khi áp dụng.',
        ],
      },
      {
        heading: '6. Chuyển dữ liệu ra nước ngoài',
        paragraphs: [
          'Một số nhà cung cấp ở mục 5 (Google, Cloudinary, nhà cung cấp máy chủ đám mây) có thể lưu trữ dữ liệu ngoài lãnh thổ Việt Nam. StockPilot chỉ chuyển phần dữ liệu tối thiểu cần thiết, chọn nhà cung cấp có cam kết bảo mật, và thực hiện hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài theo quy định của Luật Bảo vệ dữ liệu cá nhân.',
        ],
      },
      {
        heading: '7. Biện pháp bảo vệ',
        bullets: [
          'Kết nối được mã hóa bằng HTTPS; mật khẩu được băm; khóa kết nối PayOS được mã hóa AES-256.',
          'Dữ liệu mỗi cửa hàng được tách biệt; người dùng cửa hàng này không truy cập được dữ liệu cửa hàng khác.',
          'Phân quyền theo vai trò (chủ cửa hàng, nhân viên, quản trị viên) và ghi nhật ký kiểm toán các thao tác nhạy cảm.',
          'Sao lưu cơ sở dữ liệu định kỳ và có quy trình khôi phục.',
        ],
      },
      {
        heading: '8. Thời gian lưu trữ',
        bullets: [
          'Dữ liệu tài khoản và cửa hàng: trong suốt thời gian sử dụng dịch vụ và tối đa 90 ngày sau khi chấm dứt để Cửa hàng kịp yêu cầu xuất dữ liệu, sau đó xóa hoặc ẩn danh.',
          'Nhật ký kiểm toán: lưu theo thời hạn cần thiết cho mục đích an ninh và đối soát, hoặc lâu hơn nếu pháp luật yêu cầu.',
          'Thông tin liên hệ tư vấn: xóa khi bạn yêu cầu hoặc khi không còn nhu cầu tư vấn.',
        ],
      },
      {
        heading: '9. Quyền của bạn',
        paragraphs: ['Theo Luật Bảo vệ dữ liệu cá nhân, bạn có quyền:'],
        bullets: [
          'Được biết về việc xử lý dữ liệu cá nhân của mình.',
          'Đồng ý hoặc không đồng ý, và rút lại sự đồng ý.',
          'Xem, chỉnh sửa dữ liệu (hầu hết thông tin có thể tự sửa trong mục Thông tin tài khoản).',
          'Yêu cầu xóa, hạn chế xử lý, phản đối xử lý, hoặc nhận bản sao dữ liệu của mình.',
          'Khiếu nại, tố cáo, khởi kiện và yêu cầu bồi thường thiệt hại theo quy định.',
          'Gửi yêu cầu qua trang Hỗ trợ (chọn loại "Tài khoản, đăng nhập"). Việc rút lại sự đồng ý không ảnh hưởng tới các xử lý đã thực hiện hợp pháp trước đó.',
          'Khách mua hàng của một cửa hàng xin liên hệ trực tiếp cửa hàng đó, vì cửa hàng là bên kiểm soát dữ liệu của bạn; StockPilot sẽ hỗ trợ cửa hàng thực hiện yêu cầu.',
        ],
      },
      {
        heading: '10. Khi xảy ra sự cố lộ lọt dữ liệu',
        paragraphs: [
          'Nếu phát hiện vi phạm dữ liệu cá nhân, StockPilot thông báo cho cơ quan chuyên trách bảo vệ dữ liệu cá nhân thuộc Bộ Công an trong vòng 72 giờ kể từ khi phát hiện, đồng thời thông báo cho những người bị ảnh hưởng kèm hướng dẫn tự bảo vệ, theo quy định của Luật Bảo vệ dữ liệu cá nhân.',
        ],
      },
      {
        heading: '11. Cookie và lưu trữ trên trình duyệt',
        paragraphs: [
          'StockPilot dùng bộ nhớ trình duyệt để giữ phiên đăng nhập và ghi nhớ tùy chọn hiển thị (ngôn ngữ, thu gọn menu). StockPilot không dùng cookie quảng cáo hay theo dõi của bên thứ ba.',
        ],
      },
      {
        heading: '12. Liên hệ',
        paragraphs: [`Đơn vị chịu trách nhiệm: ${OPERATOR.name}. Liên hệ: ${OPERATOR.contact}.`],
      },
    ],
  },

  'giai-quyet-khieu-nai': {
    title: 'Quy chế hỗ trợ và giải quyết khiếu nại',
    summary: 'Cách gửi yêu cầu hỗ trợ, khiếu nại và thời hạn xử lý.',
    sections: [
      {
        heading: '1. Kênh tiếp nhận',
        bullets: [
          'Người dùng đã có tài khoản: mở trang Hỗ trợ trong ứng dụng và chọn "Gửi yêu cầu mới". Mỗi yêu cầu có mã số để theo dõi.',
          'Người chưa có tài khoản: để lại thông tin qua biểu mẫu liên hệ trên trang chủ.',
          'Không gửi mật khẩu, mã OTP hay khóa API trong nội dung yêu cầu. StockPilot không bao giờ hỏi những thông tin này.',
        ],
      },
      {
        heading: '2. Quy trình xử lý',
        bullets: [
          'Tiếp nhận: yêu cầu được ghi nhận ngay với trạng thái "Chờ hỗ trợ".',
          'Phản hồi: đội hỗ trợ trả lời trong ứng dụng; bạn nhận thông báo khi có phản hồi mới.',
          'Xử lý: trạng thái chuyển "Đang xử lý" hoặc "Chờ cửa hàng phản hồi" khi cần thêm thông tin từ bạn.',
          'Kết thúc: yêu cầu được đánh dấu "Đã giải quyết". Nếu chưa hài lòng, bạn trả lời tiếp để mở lại yêu cầu.',
        ],
      },
      {
        heading: '3. Thời hạn',
        paragraphs: [
          'StockPilot phản hồi lần đầu chậm nhất 2 ngày làm việc kể từ khi tiếp nhận. Thời hạn giải quyết khiếu nại tuân theo Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 và các văn bản hướng dẫn. Trường hợp cần thêm thời gian xác minh, StockPilot thông báo lý do và thời hạn dự kiến.',
        ],
      },
      {
        heading: '4. Hỗ trợ chuyển dữ liệu',
        paragraphs: [
          'Cửa hàng chuyển từ phần mềm khác (KiotViet, Sapo, MISA eShop...) hoặc từ file Excel có thể tự nhập ở trang Nhập dữ liệu. Nếu gặp lỗi, gửi yêu cầu hỗ trợ loại "Nhập dữ liệu" kèm mô tả lỗi; đội hỗ trợ xem được tiến độ các lần nhập của cửa hàng để hướng dẫn, nhưng không tự ý thay đổi dữ liệu kinh doanh của cửa hàng.',
        ],
      },
      {
        heading: '5. Khi không đạt được thỏa thuận',
        paragraphs: [
          'Các bên có thể lựa chọn hòa giải, trọng tài, hoặc yêu cầu Tòa án có thẩm quyền giải quyết theo pháp luật Việt Nam. Người tiêu dùng có thể liên hệ cơ quan quản lý nhà nước về bảo vệ quyền lợi người tiêu dùng.',
        ],
      },
    ],
  },
};

export const LEGAL_LINKS = Object.entries(LEGAL_DOCUMENTS).map(([slug, doc]) => ({ slug, title: doc.title }));
