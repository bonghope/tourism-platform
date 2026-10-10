<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <!-- Brand Info -->
        <div class="footer-col brand-col">
          <h2 class="footer-logo">TaVivu</h2>
          <p class="brand-desc">
            Thương hiệu lữ hành mũi nhọn thuộc hệ sinh thái Tai Group. 
            Kiến tạo những hành trình trọn vẹn, đẳng cấp và cá nhân hóa.
          </p>
          <div class="social-links">
            <a href="#" class="social-icon">Facebook</a>
            <a href="#" class="social-icon">Instagram</a>
            <a href="#" class="social-icon">Twitter</a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-col">
          <h3 class="col-title">Điều hướng</h3>
          <ul class="footer-links">
            <li><router-link to="/">Trang chủ</router-link></li>
            <li><router-link to="/tours">Tour</router-link></li>
            <li><router-link to="/destinations">Điểm đến</router-link></li>
            <li><router-link to="/about">Về chúng tôi</router-link></li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div class="footer-col contact-col">
          <h3 class="col-title">Liên hệ</h3>
          <ul class="contact-info">
            <li>
              <strong>Địa chỉ:</strong> Tòa nhà Tai Group, Hà Nội
            </li>
            <li>
              <strong>Hotline:</strong> 0987 999 999
            </li>
            <li>
              <strong>Email:</strong> contact@tavivu.com
            </li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2026 TaVivu (Member of Tai Group). All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--secondary-color);
  color: #f1f5f9;
  padding: 80px 0 20px;
  margin-top: auto;
}
.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr;
  gap: 40px;
  margin-bottom: 60px;
}
.footer-logo {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
}
.brand-desc {
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 300px;
}
.social-links {
  display: flex;
  gap: 16px;
}
.social-icon {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: color 0.3s;
}
.social-icon:hover {
  color: var(--primary-color);
}
.col-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  margin-bottom: 24px;
}
.footer-links {
  list-style: none;
  padding: 0;
}
.footer-links li {
  margin-bottom: 12px;
}
.footer-links a {
  text-decoration: none;
  color: #94a3b8;
  transition: color 0.3s;
}
.footer-links a:hover {
  color: white;
}
.contact-info {
  list-style: none;
  padding: 0;
}
.contact-info li {
  color: #94a3b8;
  margin-bottom: 16px;
  line-height: 1.5;
}
.contact-info strong {
  color: white;
  display: block;
  margin-bottom: 4px;
}
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 24px;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}

@media (max-width: 992px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
  .brand-col {
    grid-column: 1 / -1;
  }
}
@media (max-width: 576px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
