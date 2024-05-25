export interface ITEmail {
    id: string;
    code: string;
    subject: string;
    content: string;
    created_time: Date;
    created_by: string;
    updated_time: Date;
    updated_by: string;
}

interface KeyType {
    [key: string]: string; // Thêm index signature
}

export const KEY: KeyType = {
    fullname: "Họ và tên",
    phone: "Số điện thoại",
    roles: "Phân quyền",
    position: "Chúc vụ",
    is_active: "Trạng thái hoạt động",
    avatar: "Ảnh đại diện",
    research_area: "Lĩnh vực",
    name: "Tên lĩnh vực",
    number: "Mã lĩnh vực",
    experience: "Số năm kinh nghiệm",
    cccd: "Số căn cước công dân",
    class: "Lớp",
    school: "Viện/Trường",
    gen: "Khóa",
    degree: "Trình độ",
};
