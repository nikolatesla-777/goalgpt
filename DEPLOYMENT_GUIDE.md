
# 🚀 Hybrid Deployment Architecture Guide (Vercel + VPS)

Sisteminizin kusursuz çalışması için neden **Vercel'in tek başına yetmeyeceğini** ve **VPS (Sanal Sunucu)** gerektiğini aşağıda açıkladım.

## 🛑 Problem: Neden Vercel Yetmez?

1.  **IP Sorunu (Whitelist):**
    *   TheSports API'si, güvenliği için "Sabit IP" ister.
    *   Vercel "Serverless" çalıştığı için çıkış IP'si her saniye değişir. Bu yüzden TheSports'a "Şu IP'ye izin ver" diyemezsiniz ve sürekli **"Unauthorized"** hatası alırsınız.

2.  **WebSocket (Canlı Bağlantı) Sorunu:**
    *   Yazdığımız `listen-ws.ts` betiği, maç bitene kadar (90 dakika) sunucuyla **kesintisiz** bağlı kalmalıdır.
    *   Vercel fonksiyonları (Serverless Functions) maksimum **10-60 saniye** çalışır ve sonra otomatik kapanır.
    *   Bu yüzden Vercel'de maç takibi sürekli kopar, canlı veri akmaz.

---

## ✅ Çözüm: Hibrit Yapı (Hybrid Architecture)

En profesyonel ve maliyet etkin çözüm şudur:

1.  **Web Sitesi (Next.js) -> Vercel'de Kalacak**
    *   Hızlıdır, SEO dostudur, kullanıcı trafiğini iyi yönetir.
    *   Kullanıcılar sitenize girmeye devam edecek.

2.  **Listener Robotu (listen-ws.ts) -> VPS'e Taşınacak**
    *   Küçük bir Linux sunucu (Örn: Hetzner, DigitalOcean) kiralanır (~4-5$ aylık).
    *   Bu sunucunun **IP adresi sabittir**. TheSports paneline bu IP girilir ve erişim izni %100 açılır.
    *   `listen-ws.ts` burada 7/24 aralıksız çalışır. Maç verilerini alır ve **Supabase** veritabanına yazar.
    *   Vercel'deki siteniz, Supabase'den bu veriyi okur.

### 🛠️ Kurulum Adımları (VPS İçin)

1.  **Sunucu Kiralama:** Ubuntu 24.04 (DigitalOcean Droplet veya Hetzner Cloud). En ucuz paket yeterlidir.
2.  **Node.js Kurulumu:**
    ```bash
    sudo apt update
    sudo apt install -y nodejs npm
    npm install -g pm2
    ```
3.  **Kodu Çekme:**
    Projenizi sunucuya kopyalayın veya Git'ten çekin.
4.  **Robotu Başlatma (Arka Planda):**
    ```bash
    # Proje klasöründe
    npm install
    npx pm2 start scripts/listen-ws.ts --name "mac-takip-botu"
    ```
5.  **IP İzni:**
    Sunucunuzun IP adresini (örn: `159.223.x.x`) TheSports panelindeki "Whitelist" kısmına ekleyin.

## 🏢 Önerilen Sunucu Firmaları

Sizin için en uygun (Fiyat/Performans) firmalar şunlardır:

### 1. Hetzner (Favorim 🏆)
*   **Neden:** Dünyanın en ucuz ve en güçlü sunucularını verir.
*   **Paket:** "CPX11" veya "CX22"
*   **Fiyat:** ~4-5€ / Ay
*   **Lokasyon:** Almanya (Bu API için çok hızlıdır)
*   **Zorluk:** Kayıt olurken kimlik doğrulaması isteyebilir.

### 2. DigitalOcean (En Kolay 🟢)
*   **Neden:** Paneli çok basittir, saniyeler içinde sunucu açarsınız.
*   **Paket:** "Basic Droplet" (Regular)
*   **Fiyat:** 4$ veya 6$ / Ay
*   **Lokasyon:** Frankfurt veya Amsterdam seçin.
*   **Avantaj:** İlk üyelikte genellikle 100-200$ kredi verirler.

### 3. Vultr
*   **Neden:** DigitalOcean benzeri, bazen daha ucuz seçenekleri var.
*   **Fiyat:** 2.50$ - 5$ / Ay
*   **Lokasyon:** Avrupa seçilmelidir.

**Tavsiyem:** Eğer hızlıca işimi halledeyim derseniz **DigitalOcean**. En ucuza en kalitelisini alayım derseniz **Hetzner**.

Bu yapı kurulduğunda sisteminiz kesintisiz, hatasız ve profesyonelce çalışacaktır.
