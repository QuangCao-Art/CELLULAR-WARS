# CELLULAR WARS - Data Base

This document serves as the central repository for recording data and information regarding the **CELLULAR WARS** game project.

## 🧬 CELLULAR WARS: RULEBOOK

### 1. THIẾT LẬP (SETUP) - ĐỘI HÌNH TAM GIÁC
*   **Đội hình**: 3 Monster xếp thành hình Tam Giác (1 Vanguard - 2 Wings).
    *   **Vanguard (Mũi nhọn)**: Đứng đầu. Chịu đòn trực tiếp. Đối thủ BẮT BUỘC tấn công vị trí này trước (trừ khi dùng chiêu xuyên thấu/AOE).
    *   **Wings (Cánh)**: Đứng sau hỗ trợ và tích lũy. Được Vanguard che chắn.
*   **Sinh mệnh (Pellicle)**: Mỗi Monster bắt đầu với **1 Pellicle** mặc định.
*   **Quy tắc 1-Hit**: Không có thanh HP. 0 Pellicle + Bị đánh = **OUT**.

### 2. QUY TẮC PELLICLE (HỆ THỐNG MÀNG)
*   **Nạp (Reinforce)**: Đầu lượt nhận **2 Pellicle** để chia cho các Oddie (Tối đa 2 điểm/lượt).
*   **Ngưỡng quá tải (Overload)**: Max **5 Pellicle/Oddie**. Nếu nhận điểm thứ 6 -> **TỰ NỔ (OUT)**.
    *   **Phản ứng dây chuyền (Chain Reaction)**: Khi một Monster nổ do Overload, nó gây **1 Sát thương (Thổi bay 1 Pellicle)** lên tất cả đồng đội đứng cạnh (Vanguard nổ -> Wings dính đạn và ngược lại).
*   **Chặn đòn**: Tiêu tốn **1 Pellicle** để triệt tiêu hoàn toàn 1 đòn tấn công từ đối thủ.

### Thuật Ngữ (Glossary)
*   **Pellicle (P)**: Đơn vị năng lượng kiêm lá chắn của Monster.
*   **Hit Effect**: Hiệu ứng khi Monster bị trừ 1 Pellicle (bao gồm bị đánh, phản đòn, nổ lan). Thể hiện bằng việc Monster nháy đỏ (`hit-flash`) và màn hình rung (`shake`).
*   **Pellicle Ability Effect**: Hiệu ứng khi kích hoạt kỹ năng Pellicle (VD: Lydrosome chuyền P). Monster sẽ tỏa sáng xanh lá nhẹ và có hiệu ứng Power Up.
*   **Pellicle Ability UX**: Để kích hoạt kỹ năng chủ động (như Osmotic Flow), người chơi **Bấm chọn Monster** (Monster sẽ chớp tắt/Glow) -> Sau đó **Bấm vào Mục tiêu** để thực thi.
*   **Vanguard**: Vị trí tiền đạo (đứng đầu).
*   **Wings**: Vị trí cánh (đứng sau).
*   **Reinforce Phase**: Giai đoạn nạp năng lượng.
*   **Action Phase**: Giai đoạn hành động/tấn công.

### 3. CẤU TRÚC LƯỢT CHƠI (PHASES)
1.  **Giai đoạn Nạp (Reinforce)**: Nhận 2 Pellicle và phân bổ vào các Oddie.
2.  **Giai đoạn Pellicle (Ability)**: Kích hoạt các kỹ năng hỗ trợ hoặc nội tại (như chuyển màng của Lydrosome).
3.  **Giai đoạn Khai hỏa (Attack Phase)**: Chọn **duy nhất 1** Oddie để tấn công.

### 4. CƠ CHẾ CHIẾN ĐẤU & DI CHUYỂN
*   **Xoay Đội Hình (Tactical Swap)**: **Miễn phí (Free)**. Tuy nhiên, các Monster tham gia xoay vị trí sẽ **không được Tấn công** trong lượt đó. (Vanguard về Cánh, Cánh lên Vanguard).
*   **Pellicle Burn**: Mọi đòn tấn công đều tốn Pellicle. Không có đòn đánh miễn phí.

### 5. QUY TẮC THÍCH NGHI LƯỢT ĐẦU (Acclimatization)
*   **Lượt 1 (Người đi trước)**: Chỉ được Nạp (Reinforce). Khóa cả Pellicle Ability và Attack Ability.
*   **Lượt 1 (Người đi sau)**: Được phép dùng Pellicle Ability (tự vệ) nhưng vẫn khóa Attack Ability.
*   **Từ lượt 2 trở đi**: Mở khóa hoàn toàn.

### 6. CHIẾN THUẬT CỐT LÕI
*   **Quản lý rủi ro**: Tấn công càng mạnh thì tự vệ càng yếu (vì đốt sạch Pellicle).
*   **Ép Overload**: Sử dụng thẻ bài hoặc kỹ năng để bơm "thừa" Pellicle cho đối thủ, khiến chúng tự nổ.
*   **Lọc máu**: Hy sinh Nitrophil để bào mòn đội hình địch bằng phản sát thương, dồn tài nguyên cho Canobolus dứt điểm.
*   **Điều kiện thắng**: Loại bỏ toàn bộ 3 Monster của đối phương.

### 7. THE LAST STAND (Khi bạn chỉ còn 1 Monster duy nhất)
*   **Độc cô cầu bại (Unstable Trait)**: Monster cuối cùng trở nên "Bất ổn định". **Miễn nhiễm Overload**. Có thể tích tụ >5 Pellicle mà không bị nổ.
*   **Năng lượng**: Nhận **3 Pellicle** mỗi lượt nạp.
*   **Hành động**: Được quyền Tấn công **2 lần** (Mỗi lần chọn 1 mục tiêu khác nhau hoặc dồn vào 1 mục tiêu).
*   **Cái giá**: Mỗi lần tấn công vẫn phải trả phí Pellicle Burn như bình thường.

---

## 🦠 MONSTER DATA

### Bảng Kỹ Năng (Abilities)

**Team A: The Cell Trio**

| Monster | Vai trò | Attack Ability (Chủ động - Tốn P) | Pellicle Ability (Nội tại/Hỗ trợ) |
| :--- | :--- | :--- | :--- |
| **Nitrophil** | **Pháo hôi** | **Nitro Blast (2P)**: Phá 1 màng mục tiêu + 1 sát thương lan (phá 1 màng con đứng cạnh mục tiêu đó). | **Reactive Membrane**: Mỗi khi bị phá 1 màng, Nitrophil ngay lập tức phản lại 1 sát thương lên kẻ vừa tấn công. |
| **Lydrosome** | **Điều phối** | **Hydro Shot (2P)**: Phá 1 màng mục tiêu. Có thể bắn xuyên qua Vanguard để trúng hàng sau (Wings) trực tiếp. | **Osmotic Flow (Phase 2)**: Cho phép di chuyển bất kỳ số lượng màng nào từ Lydrosome sang cho đồng đội còn sống. |
| **Canobolus** | **Trọng pháo** | **Ballistic Volley (XP)**: Đốt sạch X màng đang có để bắn ra X phát đạn. Mỗi phát phá 1 màng (Có thể dồn vào 1 mục tiêu). | **Root Synergy**: Khi được nạp Pellicle, Canobolus tự động nhận thêm **+1 Pellicle**. |

### Thông Tin Chi Tiết (Lore & Mechanics)

| Tên | Hình ảnh | Hệ (Element) | Phân loại | Cơ chế chính | Ý tưởng nguyên bản |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Nitrophil** | ![Nitrophil](Images/Nitrophil.png) | Hỏa/Hóa chất | Guardian / Bouncer | **Reactive Membrane**: Phản sát thương khi bị tấn công và gây sát thương lan. | Dựa trên tế bào bạch cầu trung tính (Neutrophil) – tự nổ để diệt khuẩn. |
| **Lydrosome** | ![Lydrosome](Images/Lydrosome.png) | Thủy/Enzyme | Tactician / Medic | **Osmotic Control**: Chuyển màng cho đồng đội và khóa khả năng nạp của địch. | Dựa trên tiêu thể (Lysosome) – túi chứa enzyme tiêu hóa và điều tiết nước. |
| **Canobolus** | ![Canobolus](Images/Canobolus.png) | Mộc/Quang năng | Glass Cannon / Carry | **Root Synergy**: Khi được nạp Pellicle, Canobolus tự động nhận thêm +1 Pellicle. | (Thực vật/Quang hợp - Giả tưởng) |

### Tổng quan chiến thuật
*   **Nitrophil**: Đừng chạm vào nó nếu không muốn "gậy ông đập lưng ông".
*   **Lydrosome**: Trái tim của đội hình, vừa là túi máu, vừa là kẻ khóa chân chủ lực đối phương.
*   **Canobolus**: Cỗ máy hủy diệt. Chỉ cần nạp 2 lượt là đủ màng để bắn tan nát đội hình địch.

---

## 🔒 BACKLOG (DỮ LIỆU ĐỂ DÀNH)

**Team B: GLITCH (Sức mạnh & Cướp đoạt)**

| Monster | Vai trò | Attack Ability | Pellicle Ability (Nội tại) |
| :--- | :--- | :--- | :--- |
| **Militon** | Tanker | **Big Slam (2P)**: Sát thương lớn (2 màng). | **Bodyguard**: Buộc địch đánh mình trước. |
| **Glubess** | Tiếp tế | **Sugar Rush (2P)**: Đánh & Hồi màng. | **Free Gift**: Tặng Pellicle khi vào trận. |
| **Virob** | Quấy rối | **Quick Rob (2P)**: Đánh & Cướp Pellicle. | **Loot Drop**: Chết là để lại "di chúc" P.
