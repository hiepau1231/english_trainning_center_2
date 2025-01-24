# Tài Liệu API Quản Lý Lịch Học

## Các Endpoint

### Tạo Lịch Học Mới
`POST /schedules/class`

Tạo lịch học mới cho lớp với kiểm tra xung đột.

**Request Body:** `CreateScheduleDto`
```typescript
{
  // Xem create-schedule.dto.ts để biết chi tiết
  classId: number;      // ID của lớp học
  roomId: number;       // ID của phòng học
  teacherId: number;    // ID của giáo viên
  startDate: string;    // Ngày bắt đầu
  endDate: string;      // Ngày kết thúc
  // ... các trường khác
}
```

**Response:** `ScheduleResponseDto`
```typescript
{
  success: boolean;     // Trạng thái thành công
  data?: Schedule;      // Dữ liệu lịch học (nếu thành công)
  conflicts?: ConflictInfo[]; // Thông tin xung đột (nếu có)
  message?: string;     // Thông báo
}
```

### Tìm Kiếm Khung Giờ Trống
`GET /schedules/available-slots`

Tìm các khung giờ trống dựa trên lịch của giáo viên và phòng học.

**Query Parameters:**
- `teacherId` (number, bắt buộc): ID của giáo viên
- `rooms` (string, bắt buộc): Danh sách ID phòng học (phân cách bởi dấu phẩy)
- `startDate` (string, bắt buộc): Ngày bắt đầu (định dạng ISO)
- `endDate` (string, bắt buộc): Ngày kết thúc (định dạng ISO)
- `preferredDays` (string, tùy chọn): Các ngày trong tuần (0-6, 0 là Chủ nhật)
  - Mặc định: [1,2,3,4,5] (Thứ 2 đến Thứ 6)

**Response:** `AvailableSlotsResponseDto`
```typescript
{
  success: boolean;           // Trạng thái thành công
  availableSlots: TimeSlot[]; // Danh sách khung giờ trống
  message?: string;          // Thông báo
}
```

### Xem Lịch Học Của Lớp
`GET /schedules/class/:classId`

Lấy thông tin lịch học của một lớp cụ thể.

**Path Parameters:**
- `classId` (number, bắt buộc): ID của lớp học

**Response:** `ScheduleResponseDto`
```typescript
{
  success: boolean;    // Trạng thái thành công
  data?: Schedule;     // Dữ liệu lịch học
  message?: string;    // Thông báo
}
```

### Xem Lịch Dạy Của Giáo Viên
`GET /schedules/teacher/:teacherId`

Lấy lịch dạy của một giáo viên.

**Path Parameters:**
- `teacherId` (number, bắt buộc): ID của giáo viên

**Query Parameters:**
- `startDate` (string, bắt buộc): Ngày bắt đầu (định dạng ISO)
- `endDate` (string, bắt buộc): Ngày kết thúc (định dạng ISO)

**Response:** `ScheduleResponseDto`
```typescript
{
  success: boolean;    // Trạng thái thành công
  data?: Schedule;     // Dữ liệu lịch dạy
  message?: string;    // Thông báo
}
```

### Xem Lịch Sử Dụng Phòng
`GET /schedules/room/:roomId`

Lấy lịch sử dụng của một phòng học.

**Path Parameters:**
- `roomId` (number, bắt buộc): ID của phòng học

**Query Parameters:**
- `startDate` (string, bắt buộc): Ngày bắt đầu (định dạng ISO)
- `endDate` (string, bắt buộc): Ngày kết thúc (định dạng ISO)

**Response:** `ScheduleResponseDto`
```typescript
{
  success: boolean;    // Trạng thái thành công
  data?: Schedule;     // Dữ liệu lịch sử dụng
  message?: string;    // Thông báo
}
```

### Cập Nhật Lịch Học
`PUT /schedules/:id`

Cập nhật lịch học với kiểm tra xung đột.

**Path Parameters:**
- `id` (number, bắt buộc): ID của lịch học

**Request Body:** `UpdateScheduleDto`
```typescript
{
  // Xem update-schedule.dto.ts để biết chi tiết
  roomId?: number;      // ID phòng học mới
  teacherId?: number;   // ID giáo viên mới
  startDate?: string;   // Ngày bắt đầu mới
  endDate?: string;     // Ngày kết thúc mới
  // ... các trường khác
}
```

**Response:** `ScheduleResponseDto`
```typescript
{
  success: boolean;     // Trạng thái thành công
  data?: Schedule;      // Dữ liệu lịch học đã cập nhật
  conflicts?: ConflictInfo[]; // Thông tin xung đột (nếu có)
  message?: string;     // Thông báo
}
```

### Xóa Lịch Học
`DELETE /schedules/:id`

Xóa một lịch học.

**Path Parameters:**
- `id` (number, bắt buộc): ID của lịch học

**Response:**
```typescript
{
  success: boolean;    // Trạng thái thành công
  message: string;     // Thông báo
}
```

## Xử Lý Lỗi

API sử dụng các mã HTTP chuẩn:

- `200` Thành công
- `201` Đã tạo mới (cho các request POST)
- `400` Yêu cầu không hợp lệ
- `404` Không tìm thấy
- `500` Lỗi hệ thống

Phản hồi khi có xung đột (không thể tạo/cập nhật do trùng lịch):
```typescript
{
  success: false,
  conflicts: [
    {
      type: 'TEACHER' | 'ROOM',     // Loại xung đột
      entityId: number,             // ID của đối tượng xung đột
      conflictingScheduleId: number, // ID của lịch học bị xung đột
      startTime: Date,              // Thời gian bắt đầu xung đột
      endTime: Date                 // Thời gian kết thúc xung đột
    }
  ],
  message: string  // Thông báo lỗi
}
```

## Hướng Dẫn Testing

Khi viết test cho các endpoint:

1. Mock `SchedulingService` cho controller tests
2. Test cả trường hợp thành công và thất bại
3. Kiểm tra định dạng response
4. Kiểm tra xử lý xung đột
5. Xác thực việc parse ngày tháng từ query parameters