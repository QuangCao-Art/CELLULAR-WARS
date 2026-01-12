# CELLULAR WARS - Data Base

This document serves as the central repository for recording data and information regarding the **CELLULAR WARS** game project.

## 📌 QUICK START SUMMARY (TÓM TẮT LUẬT CHƠI)
- **Mục tiêu**: Tiêu diệt toàn bộ 3 quái vật của đối thủ.
- **Đội hình**: Xếp hình tam giác (**1 Vanguard** - 2 Wings). Vanguard phải bị tiêu diệt trước (trừ đòn xuyên thấu).
- **Lượt chơi**:
    1. **Reinforce (Nạp)**: Nhận 2 Pellicle, chia cho quái vật (Tối đa 5 điểm/con).
    2. **Action (Trail)**: Kích hoạt chuyên biệt **Offensive Trail** hoặc **Pellicle Trail**.
    3. **Combat (Tấn công)**: Chọn 1 quái vật để tấn công (Tốn Pellicle).
- **Cơ chế Overload**: Nếu con nào nhận hạt Pellicle thứ 6 -> **TỰ NỔ**, gây sát thương lan cho đồng đội bên cạnh.

## 🦖 CELLDEX SUMMARY (TÓM TẮT CÁC CHỦNG LOÀI)
- **Cell01 - Canobolus**: Nhận thêm +1 Pellicle khi được nạp. Offensive Trail bắn liên hồi.
- **Cell02 - Lydrosome**: Điều phối Pellicle cho đồng đội. Offensive Trail bắn xuyên Vanguard.
- **Cell03 - Nitrophil**: Phản sát thương khi bị đánh. Offensive Trail gây nổ lan.
- **Cell04 - Phagoburst**: Khởi đầu chậm nhưng sức mạnh bộc phát. Offensive Trail bắn ra 3 shot liên tiếp.
- **Cell05 - Fibron**: Linh hoạt và cơ động. Nhận thêm Pellicle khi ra sân từ khu dự bị.
- **Cell06 - Kerashell**: Bắt đầu trận với 2 Pellicle (Vanguard). Offensive Trail thực dụng, giá rẻ.
- **Cell07 - Mitonegy**: Tặng Pellicle cho đồng đội khi vào trận. Offensive Trail hỗ trợ hồi phục.
- **Cell08 - Chlarob**: Cướp Pellicle của đối thủ. Pellicle Trail tặng quà khi bị hạ.
- **Cell09 - Dip-Alpha**: Một nửa của bộ đôi song sinh. Gây sát thương lên Vanguard địch khi bị hạ.
- **Cell10 - Dip-Beta**: Một nửa của bộ đôi song sinh. Gây sát thương lên Wing mạnh nhất của địch khi bị hạ.
- **Double Team Bonus**: Nếu cả Dip-Alpha và Dip-Beta cùng trong Active Zone, cả hai đều có thể tấn công trong cùng một lượt.

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
*   **Pellicle Trail Effect**: Hiệu ứng khi kích hoạt kỹ năng Pellicle (VD: Lydrosome chuyền P). Monster sẽ tỏa sáng xanh lá nhẹ và có hiệu ứng Power Up.
*   **Pellicle Trail UX**: Để kích hoạt kỹ năng chủ động (như Osmotic Flow), người chơi **Bấm chọn Monster** (Monster sẽ chớp tắt/Glow) -> Sau đó **Bấm vào Mục tiêu** để thực thi.
*   **Vanguard**: Vị trí tiền đạo (đứng đầu).
*   **Wings**: Vị trí cánh (đứng sau).
*   **Reinforce Phase**: Giai đoạn nạp năng lượng.
*   **Action Phase (Trail Phase)**: Giai đoạn kích hoạt Trail (Offensive/Pellicle).
*   **Combat Phase**: Giai đoạn hành động/tấn công.

### 3. CẤU TRÚC LƯỢT CHƠI (PHASES)
1.  **Giai đoạn Nạp (Reinforce)**: Nhận 2 Pellicle và phân bổ vào các Oddie.
2.  **Giai đoạn Hành động (Action)**: Kích hoạt các chuyên biệt **Offensive Trail** hoặc **Pellicle Trail**.
3.  **Giai đoạn Giao tranh (Combat Phase)**: Chọn **duy nhất 1** Oddie để tấn công.

### 4. CƠ CHẾ CHIẾN ĐẤU & DI CHUYỂN
*   **Xoay Đội Hình (Tactical Swap)**: **Miễn phí (Free)**. Tuy nhiên, các Monster tham gia xoay vị trí sẽ **không được Tấn công** trong lượt đó. (Vanguard về Cánh, Cánh lên Vanguard).
*   **Pellicle Burn**: Mọi đòn tấn công đều tốn Pellicle. Không có đòn đánh miễn phí.

### 5. QUY TẮC THÍCH NGHI LƯỢT ĐẦU (Acclimatization)
*   **Lượt 1 (Người đi trước)**: Chỉ được Nạp (Reinforce). Khóa cả Pellicle Trail và Offensive Trail.
*   **Lượt 1 (Người đi sau)**: Được phép dùng Pellicle Trail (tự vệ) nhưng vẫn khóa Offensive Trail.
*   **Từ lượt 2 trở đi**: Mở khóa hoàn toàn.

### 6. QUY TẮC KHU VỰC DỰ BỊ (RESERVE AREA)
*   **Không chiến đấu (Non-Combat)**: Monsters ở Reserve (Index 3 & 4) **không thể tấn công** và **không thể bị tấn công** (Untargetable).
*   **Không nạp (No Reinforce)**: Không thể nhận Pellicle tokens trực tiếp từ giai đoạn Nạp.
*   **Ngừng kích hoạt (Dormant)**: Toàn bộ kỹ năng (Active/Passive) bị vô hiệu hóa. Đồng thời **không bị ảnh hưởng bởi Overload** (Immune to Explosion).
*   **Bảo toàn năng lượng**: Khi thực hiện Tactical Swap, Oddie giữ nguyên số lượng Pellicle hiện có.
*   **Miễn nhiễm sát thương lan**: Không nhận sát thương từ Chain Reaction của đồng đội bên cạnh.

### 7. CHIẾN THUẬT CỐT LÕI
*   **Quản lý rủi ro**: Tấn công càng mạnh thì tự vệ càng yếu (vì đốt sạch Pellicle).
*   **Ép Overload**: Sử dụng thẻ bài hoặc kỹ năng để bơm "thừa" Pellicle cho đối thủ, khiến chúng tự nổ.
*   **Lọc máu**: Hy sinh Nitrophil để bào mòn đội hình địch bằng phản sát thương, dồn tài nguyên cho Canobolus dứt điểm.
*   **Điều kiện thắng**: Loại bỏ toàn bộ 3 Monster của đối phương.


---

## 🦠 CELLDEX DATA
 
 ### Bảng Chỉ Số Chủng Loài (Cellular Trails)
 
| ID | Monster | Offensive Trail (Chủ động - Tốn P) | Pellicle Trail (Nội tại/Hỗ trợ) |
| :--- | :--- | :--- | :--- |
| **Cell01** | **Canobolus** | **Ballistic Volley (XP)**: Đốt sạch X màng đang có để bắn ra X phát đạn. Mỗi phát phá 1 màng. | **Root Synergy**: Ngưỡng Overload là 7. |
| **Cell02** | **Lydrosome** | **Hydro Shot (2P)**: Phá 1 màng. Có thể bắn xuyên qua Vanguard để trúng hàng sau (Wings). | **Osmotic Flow (Action Phase)**: Cho phép di chuyển Pellicle sang cho đồng đội. |
| **Cell03** | **Nitrophil** | **Nitro Burn (1P)**: Phá 1 màng mục tiêu (Không gây nổ lan). | **Reactive Membrane**: Phản lại 1 sát thương lên kẻ vừa tấn công. |
| **Cell04** | **Phagoburst** | **Triple Pop (2P)**: Bắn liên tiếp 3 shot (Phá 3 màng). | **Heavy Primer**: Lượt 1 không nạp P. Các lượt sau max 1P/lượt. |
| **Cell05** | **Fibron** | **Fiber Sting (1P)**: Phá 1 màng mục tiêu. | **Reinforce Entry**: Ra sân từ dự bị nhận ngay +1P (1 lần/trận). |
| **Cell06** | **Kerashell** | **Light Strike (1P)**: Phá 1 màng mục tiêu (Thực dụng, rẻ). | **Vanguard**: Bắt đầu ván đấu với 2 Pellicle (khi ở vị trí Vanguard). |
| **Cell07** | **Mitonegy** | **Auto-Repair (2P)**: Phá 1 màng đối thủ + Hồi 1 màng cho đồng đội ít P nhất. | **Free Gift**: Vào trận, tặng ngay mỗi đồng đội +1P. |
| **Cell08** | **Chlarob** | **Quick Rob (2P)**: Phá 1 màng + Cướp 1P của đối thủ về cho mình. | **Loot Drop**: Khi bị hạ, +1P cho đồng đội có số P ít nhất. |
| **Cell09** | **Dip-Alpha** | **Twin Sting (1P)**: Phá 1 màng mục tiêu. | **Legacy Crash**: Khi OUT, -1P của enemy Vanguard. |
| **Cell10** | **Dip-Beta** | **Twin Sting (1P)**: Phá 1 màng mục tiêu. | **Energy Leak**: Khi OUT, -1P của đứa cao P ở vị trí Wings. |
 
 ### Thông Tin Chi Tiết (Lore & Mechanics)
 
| ID | Monster | Hình ảnh | Phân loại | Mô tả Lore (Lịch sử & Đặc tính) |
| :--- | :--- | :--- | :--- | :--- |
| **Cell01** | **Canobolus** | ![Canobolus](Images/Canobolus.png) | Glass Cannon / Carry | **Bào tử bắn - Ballistospore**: Tế bào nấm mang cơ chế áp suất máy bắn đá; nó bám rễ để hấp thụ Pellicle cực nhanh và xả ra những đợt đạn bào tử liên tiếp như pháo cao xạ. |
| **Cell02** | **Lydrosome** | ![Lydrosome](Images/Lydrosome.png) | Tactician / Medic | **Tiêu thể - Lysosome**: Túi chứa Enzyme phân hủy bị nhiễm men; nó tiết dịch khóa chặt các phản ứng sinh hóa của địch và có thể chuyển hóa lớp màng bảo vệ cho đồng đội. |
| **Cell03** | **Nitrophil** | ![Nitrophil](Images/Nitrophil.png) | Guardian / Bouncer | **Bạch cầu trung tính**: Tế bào miễn dịch đột biến mang đặc tính nổ; nó tiêu diệt kẻ địch bằng dịch Nitro lan tỏa và phản đòn lập tức khi lớp màng bị xâm phạm. |
| **Cell04** | **Phagoburst** | - | Burst Damager | **Tế bào thực bào - Phagocyte**: Kẻ dọn dẹp khổng lồ với cấu trúc đa nhân phức tạp; nó hấp thụ năng lượng cực chậm nhưng có thể kích nổ một đợt 3 phát bắn hủy diệt mục tiêu. |
| **Cell05** | **Fibron** | - | Mobility Support | **Tế bào sợi - Fibroblast**: Tế bào tạo liên kết được gia cố vi mạch; nó di chuyển linh hoạt từ vùng dự bị ra sân để nhận thêm năng lượng và tung đòn đâm xuyên giá rẻ. |
| **Cell06** | **Kerashell** | - | Tanker | **Tế bào sừng - Keratinocyte**: Lớp vỏ từ Protein sừng của da được nén cứng; nó sở hữu sức bền tự thân cao và khả năng tấn công tiêu hao ít năng lượng nhất đội hình. |
| **Cell07** | **Mitonegy** | - | Support | **Ti thể - Mitochondria**: Bào quan tạo năng lượng bị lỗi mã nguồn; nó hoạt động như một máy biến áp, phân phát Pellicle đầu trận và tự động vá màng cho đồng đội yếu nhất. |
| **Cell08** | **Chlarob** | - | Scavenger | **Vi khuẩn Chlamydia**: Vi khuẩn ký sinh nội bào bắt buộc; nó thâm nhập sâu vào tế bào đối phương để cướp năng lượng và giải phóng tài nguyên cứu trợ khi bị tiêu diệt. |
| **Cell09** | **Dip-Alpha** | - | Dual Combatant | **Song cầu khuẩn - Diplococcus**: Biến thể "anh" của cặp vi khuẩn song sinh; gã phối hợp tấn công kép cùng em mình nhưng cái chết của gã sẽ rút cạn năng lượng của kẻ địch. |
| **Cell10** | **Dip-Beta** | - | Dual Combatant | **Song cầu khuẩn - Diplococcus**: Biến thể "em" của cặp vi khuẩn song sinh; cô cùng anh trai tạo ra gọng kìm tấn công liên tục, nhưng nếu bị OUT sẽ làm rò rỉ năng lượng của kẻ địch. |
