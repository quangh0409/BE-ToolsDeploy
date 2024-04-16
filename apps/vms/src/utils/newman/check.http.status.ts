function handleStatusCode(statusCode: number) {
    switch (statusCode) {
        // Information responses
        case 100:
        case 101:
        case 102:
        case 103:
        // Successful responses
        case 200:
        case 201:
        case 202:
        case 203:
        case 204:
        case 205:
        case 206:
        case 207:
        case 208:
        case 226:
        // Redirects
        case 300:
        case 301:
        case 302:
        case 303:
        case 304:
        case 305:
        case 306:
        case 307:
        case 308:
            break;
        // Client errors
        case 400:
            console.log(
                "400 Bad Request: Máy chủ không thể hiểu yêu cầu do cú pháp không hợp lệ."
            );
            break;
        case 401:
            console.log("401 Unauthorized: Client chưa được xác thực.");
            break;
        case 402:
            console.log(
                "402 Payment Required: Status code này rất hiếm khi được sử dụng và không tồn tại quy ước tiêu chuẩn nào."
            );
            break;
        case 403:
            console.log(
                "403 Forbidden: Client không có quyền truy cập vào phần nội dung."
            );
            break;
        case 404:
            console.log(
                "404 Not Found: Không tìm thấy tài nguyên được yêu cầu."
            );
            break;
        case 405:
            console.log(
                "405 Method Not Allowed: Phương thức yêu cầu không được phép sử dụng."
            );
            break;
        case 406:
            console.log(
                "406 Not Acceptable: Máy chủ không tìm thấy bất kỳ nội dung nào phù hợp với các tiêu chí do user-agent đưa ra."
            );
            break;
        case 407:
            console.log(
                "407 Proxy Authentication Required: Xác thực cần thiết để được thực hiện bởi proxy."
            );
            break;
        case 408:
            console.log(
                "408 Request Timeout: Phản hồi này được gửi trên 1 kết nối idle."
            );
            break;
        case 409:
            console.log(
                "409 Conflict: Yêu cầu xung đột với trạng thái hiện tại của máy chủ."
            );
            break;
        case 410:
            console.log(
                "410 Gone: Nội dung được yêu cầu đã bị xóa vĩnh viễn khỏi máy chủ."
            );
            break;
        case 411:
            console.log(
                "411 Length Required: Máy chủ yêu cầu trường header Content-Length không được xác định."
            );
            break;
        case 412:
            console.log(
                "412 Precondition Failed: Client đã chỉ ra các điều kiện tiên quyết trong các header của nó mà máy chủ không đáp ứng được."
            );
            break;
        case 413:
            console.log(
                "413 Payload Too Large: Thực thể yêu cầu lớn hơn giới hạn do máy chủ xác định."
            );
            break;
        case 414:
            console.log(
                "414 URI Too Long: URI được yêu cầu bởi client dài hơn mức máy chủ muốn thông dịch."
            );
            break;
        case 415:
            console.log(
                "415 Unsupported Media Type: Định dạng phương tiện của dữ liệu được yêu cầu không được máy chủ hỗ trợ."
            );
            break;
        case 416:
            console.log(
                "416 Range Not Satisfiable: Client yêu cầu một phần của tập tin nhưng máy chủ không thể cung cấp nó."
            );
            break;
        case 417:
            console.log(
                "417 Expectation Failed: Máy chủ không thể đáp ứng các yêu cầu của trường Expect trong header."
            );
            break;

        // Server errors
        case 500:
            console.log(
                "500 Internal Server Error: Máy chủ gặp phải một trường hợp bất ngờ."
            );
            break;
        case 501:
            console.log(
                "501 Not Implemented: Máy chủ không công nhận các phương thức yêu cầu hoặc không có khả năng xử lý nó."
            );
            break;
        case 502:
            console.log(
                "502 Bad Gateway: Máy chủ đang hoạt động như một gateway hoặc proxy và nhận được một phản hồi không hợp lệ từ máy chủ nguồn."
            );
            break;
        case 503:
            console.log("503 Service Unavailable: Máy chủ hiện không có sẵn.");
            break;
        case 504:
            console.log(
                "504 Gateway Timeout: Máy chủ đang hoạt động như một gateway hoặc proxy và không nhận được một phản hồi từ máy chủ nguồn."
            );
            break;
        case 505:
            console.log(
                "505 HTTP Version Not Supported: Máy chủ không hỗ trợ phiên bản giao thức HTTP."
            );
            break;

        default:
            if (statusCode >= 400 && statusCode < 500) {
                console.log(
                    "Lỗi phía client: Đầu 4xx - Lỗi yêu cầu từ phía client."
                );
            } else if (statusCode >= 500 && statusCode < 600) {
                console.log("Lỗi phía máy chủ: Đầu 5xx - Lỗi từ phía máy chủ.");
            } else {
                console.log(
                    "Lỗi ứng dụng triển khai chưa thành công. Hãy kiểm tra lại database và các lỗi mạng."
                );
            }
            break;
    }
}

module.exports = { handleStatusCode };
