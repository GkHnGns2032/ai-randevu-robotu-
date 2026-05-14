# Developer Skill: Clerk Auth & Middleware Guardian

## Amacı
Kullanıcı kimlik doğrulama, yetkilendirme ve sayfa koruması işlemlerini yönetir. Güvenlik açıklarını kapatır ve admin paneli dışındaki kullanıcıların hassas verilere erişimini engeller.

## Kullanım Kuralları
1. Yeni oluşturulan tüm `app/dashboard/...` altındaki sayfaların ve yönetici panelini ilgilendiren endpointlerin `middleware.ts` kapsamında Clerk tarafından korunduğundan emin ol.
2. API route'larında veri okuma/yazma işlemi yapmadan önce Clerk `auth()` fonksiyonunu çağırarak kullanıcının oturum açıp açmadığını (`userId`) teyit et.
3. Oturumu olmayan (Unauthorized) isteklerde uygun HTTP statü kodu (401 veya 403) dön.
4. Müşteriye açık (public) API route'larında (örneğin chat arayüzü), Clerk zorunluluğu olmamalıdır, ayrımı doğru yap.

## Öncelik Seviyesi
Temel (8/9) - Sistem güvenliğini ve yönetici paneli erişim kısıtlamalarını yönetir.
