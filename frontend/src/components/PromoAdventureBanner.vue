<template>
  <section class="promo-adventure-section">
    <!-- Nền trang trí phong cách cọ vẽ / brushstroke như hình mẫu -->
    <div class="promo-container">
      <!-- CỘT TRÁI: NỘI DUNG & CÂU NÓI TRUYỀN CẢM HỨNG -->
      <div class="promo-content">
        <div class="eyebrow-pill">
          <span class="pill-dot"></span>
          <span class="pill-text">TAVIVU • HÀNH TRÌNH ĐỘC BẢN</span>
        </div>

        <!-- CÂU NÓI TRUYỀN CẢM HỨNG TỪ ẢNH USER GỬI -->
        <div class="quote-box">
          <span class="quote-icon-open">“</span>
          <h2 class="quote-text">
            Du lịch — Ban đầu nó khiến bạn không thốt nên lời, và sau đó biến bạn trở thành một người kể chuyện.
          </h2>
          <span class="quote-icon-close">”</span>
        </div>

        <p class="promo-lead">
          Dù bạn khao khát một lần đứng trên đỉnh núi cao chạm tay vào biển mây ngút ngàn, thả mình giữa làn nước ngọc bích thiên đường tại Maldives, hay lạc bước giữa bến Thượng Hải hoa lệ rực rỡ ánh đèn — TaVivu sẽ luôn đồng hành để từng bước chân của bạn trở thành những câu chuyện vô giá.
        </p>

        <!-- 3 ĐẶC ĐIỂM NỔI BẬT -->
        <div class="features-row">
          <div class="feat-item">
            <span class="feat-emoji">🏔️</span>
            <div>
              <strong>Núi Cao & Biển Đảo</strong>
              <p>Khám phá trọn vẹn mọi cảnh sắc</p>
            </div>
          </div>
          <div class="feat-item">
            <span class="feat-emoji">✈️</span>
            <div>
              <strong>Trọn Gói 5 Sao</strong>
              <p>Dịch vụ chuẩn mực & chu đáo</p>
            </div>
          </div>
        </div>

        <!-- NÚT KÊU GỌI HÀNH ĐỘNG PHONG CÁCH "SEE WHAT'S ON" NHƯ HÌNH MẪU -->
        <div class="cta-wrapper">
          <router-link to="/tours" class="btn-orange-cta">
            <span>KHÁM PHÁ CÁC TOUR</span>
            <svg class="cta-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </router-link>
          <router-link to="/destinations" class="btn-secondary-link">
            Xem 15+ Điểm Đến →
          </router-link>
        </div>
      </div>

      <!-- CỘT PHẢI: 3 BỨC ẢNH XẾP LỚP (STACKED CARDS) THEO ĐÚNG HÌNH MẪU -->
      <div class="promo-visual">
        <div class="cards-stack">
          <!-- ẢNH 1: NGƯỜI TRÊN ĐỈNH NÚI -->
          <div class="photo-card card-mountain">
            <div class="photo-frame">
              <img src="/images/promo/hiker-peak.jpg" alt="Người trên đỉnh núi ngắm biển mây" />
              <div class="card-overlay">
                <span class="card-badge">Chinh Phục Đỉnh Cao</span>
                <p class="card-caption">Đứng giữa biển mây hùng vĩ</p>
              </div>
            </div>
          </div>

          <!-- ẢNH 2: THIÊN ĐƯỜNG BIỂN MALDIVES -->
          <div class="photo-card card-maldives">
            <div class="photo-frame">
              <img src="/images/promo/maldives.jpg" alt="Thiên đường biển Maldives từ trên cao" />
              <div class="card-overlay">
                <span class="card-badge">Biển Đảo Tinh Khôi</span>
                <p class="card-caption">Thiên đường biển Maldives</p>
              </div>
            </div>
          </div>

          <!-- ẢNH 3: THÀNH PHỐ THƯỢNG HẢI -->
          <div class="photo-card card-shanghai">
            <div class="photo-frame">
              <img src="/images/promo/shanghai.jpg" alt="Khám phá vẻ đẹp Thượng Hải sầm uất" />
              <div class="card-overlay">
                <span class="card-badge">Đại Đô Thị Hoa Lệ</span>
                <p class="card-caption">Bến Thượng Hải rực rỡ</p>
              </div>
            </div>
          </div>

          <!-- STICKER HUY HIỆU PHONG CÁCH "BONDS BUILT THROUGH ADVENTURES" TỪ HÌNH MẪU -->
          <div class="adventure-badge">
            <div class="badge-content">
              <span class="badge-script">Bonds Built</span>
              <span class="badge-sub">THROUGH ADVENTURES</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Component tĩnh giàu tính thẩm mỹ, điều hướng mượt mà
</script>

<style scoped>
.promo-adventure-section {
  position: relative;
  padding: 90px 24px;
  background: var(--page-background);
  overflow: hidden;
  border-top: 1px solid rgba(229, 231, 235, 0.6);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
}


.promo-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.15fr 0.95fr;
  gap: 56px;
  align-items: center;
  position: relative;
  z-index: 1;
}

/* CỘT NỘI DUNG */
.promo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.25);
  border-radius: 999px;
  width: fit-content;
}
.pill-dot {
  width: 8px;
  height: 8px;
  background-color: #f97316;
  border-radius: 50%;
  box-shadow: 0 0 8px #f97316;
}
.pill-text {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #ea580c;
  text-transform: uppercase;
}

/* HỘP CÂU NÓI TRUYỀN CẢM HỨNG */
.quote-box {
  position: relative;
  margin: 4px 0;
}
.quote-icon-open,
.quote-icon-close {
  display: none;
}
.quote-text {
  font-size: 1.95rem;
  line-height: 1.35;
  font-weight: 800;
  color: #85370d; /* Màu nâu đất vàng hoàng kim sang trọng như hình mẫu 3 */
  letter-spacing: -0.4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.promo-lead {
  font-size: 1.02rem;
  line-height: 1.65;
  color: #4b5563;
  margin-bottom: 4px;
}

/* ĐẶC ĐIỂM NỔI BẬT */
.features-row {
  display: flex;
  gap: 28px;
  padding: 14px 0;
  border-top: 1px dashed rgba(209, 213, 219, 0.8);
  border-bottom: 1px dashed rgba(209, 213, 219, 0.8);
}
.feat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.feat-emoji {
  font-size: 1.8rem;
}
.feat-item strong {
  display: block;
  font-size: 0.95rem;
  color: #1f2937;
  font-weight: 700;
}
.feat-item p {
  font-size: 0.82rem;
  color: #6b7280;
  margin: 0;
}

/* NÚT BẤM KÊU GỌI */
.cta-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 8px;
}

.btn-orange-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #ffffff;
  padding: 14px 28px;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-decoration: none;
  box-shadow: 0 8px 20px rgba(234, 88, 12, 0.35);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.btn-orange-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(234, 88, 12, 0.45);
  background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
}
.cta-arrow {
  transition: transform 0.3s ease;
}
.btn-orange-cta:hover .cta-arrow {
  transform: translateX(4px);
}

.btn-secondary-link {
  font-size: 0.95rem;
  font-weight: 700;
  color: #4b5563;
  text-decoration: none;
  padding: 10px 16px;
  border-radius: 999px;
  transition: all 0.25s ease;
}
.btn-secondary-link:hover {
  color: #ea580c;
  background: rgba(249, 115, 22, 0.08);
}

/* CỘT PHẢI: 3 BỨC ẢNH XẾP NGHỆ THUẬT (STACKED CARDS) */
.promo-visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.cards-stack {
  position: relative;
  width: 440px;
  height: 440px;
}

/* THẺ ẢNH POLAROID / BORDER TRẮNG */
.photo-card {
  position: absolute;
  background: #ffffff;
  padding: 10px;
  border-radius: 20px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04);
  transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.photo-frame {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.photo-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.6s ease;
}

.photo-card:hover .photo-frame img {
  transform: scale(1.08);
}

/* OVERLAY VÀ CHÚ THÍCH TRÊN ẢNH */
.card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 14px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0) 100%);
  color: #ffffff;
}
.card-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(249, 115, 22, 0.9);
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 4px;
}
.card-caption {
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* ĐỊNH VỊ 3 BỨC ẢNH THEO ĐÚNG HÌNH MẪU 3 */
/* ẢNH 1: Người trên đỉnh núi (nằm lệch trái, nghiêng nhẹ) */
.card-mountain {
  width: 220px;
  height: 290px;
  top: 35px;
  left: 0px;
  transform: rotate(-7deg);
  z-index: 2;
}

/* ẢNH 2: Biển Maldives (nằm giữa cao nhất, lớp trên cùng) */
.card-maldives {
  width: 235px;
  height: 310px;
  top: -15px;
  left: 140px;
  transform: rotate(4deg);
  z-index: 4;
}

/* ẢNH 3: Bến Thượng Hải (nằm lệch phải dưới, lớp trung gian) */
.card-shanghai {
  width: 215px;
  height: 285px;
  top: 130px;
  left: 220px;
  transform: rotate(-3deg);
  z-index: 3;
}

/* HIỆU ỨNG KHI RÊ CHUỘT VÀO TỪNG THẺ ẢNH */
.photo-card:hover {
  z-index: 10 !important;
  transform: scale(1.08) rotate(0deg) !important;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.22), 0 8px 16px rgba(0, 0, 0, 0.08);
}

/* STICKER HUY HIỆU "BONDS BUILT THROUGH ADVENTURES" TỪ HÌNH MẪU 1 */
.adventure-badge {
  position: absolute;
  top: 15px;
  right: -25px;
  z-index: 6;
  background: #ffffff;
  border-radius: 50%;
  width: 105px;
  height: 105px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.16);
  border: 3px solid #ffedd5;
  transform: rotate(12deg);
  animation: floatBadge 4s ease-in-out infinite;
}
.badge-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.badge-script {
  font-family: 'Brush Script MT', 'Segoe Script', cursive, sans-serif;
  font-size: 1.15rem;
  color: #f97316;
  font-weight: 700;
  line-height: 1;
}
.badge-sub {
  font-size: 0.52rem;
  font-weight: 900;
  letter-spacing: 0.5px;
  color: #0d9488;
  margin-top: 4px;
}

@keyframes floatBadge {
  0%, 100% {
    transform: rotate(12deg) translateY(0);
  }
  50% {
    transform: rotate(8deg) translateY(-8px);
  }
}

/* RESPONSIVE */
@media (max-width: 992px) {
  .promo-container {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  .eyebrow-pill {
    margin: 0 auto;
  }
  .quote-text {
    font-size: 1.6rem;
  }
  .features-row {
    justify-content: center;
  }
  .cta-wrapper {
    justify-content: center;
  }
  .cards-stack {
    margin: 0 auto;
    width: 380px;
    height: 380px;
  }
  .card-mountain {
    width: 180px;
    height: 240px;
    left: 10px;
  }
  .card-maldives {
    width: 195px;
    height: 260px;
    left: 110px;
  }
  .card-shanghai {
    width: 180px;
    height: 240px;
    left: 180px;
  }
  .adventure-badge {
    right: 0px;
    width: 90px;
    height: 90px;
  }
}

@media (max-width: 480px) {
  .promo-adventure-section {
    padding: 60px 16px;
  }
  .quote-text {
    font-size: 1.35rem;
  }
  .features-row {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .cta-wrapper {
    flex-direction: column;
    width: 100%;
  }
  .btn-orange-cta {
    width: 100%;
    justify-content: center;
  }
  .cards-stack {
    width: 300px;
    height: 320px;
  }
  .card-mountain {
    width: 150px;
    height: 200px;
    left: 0;
  }
  .card-maldives {
    width: 160px;
    height: 215px;
    left: 80px;
  }
  .card-shanghai {
    width: 150px;
    height: 200px;
    left: 140px;
  }
}
</style>
