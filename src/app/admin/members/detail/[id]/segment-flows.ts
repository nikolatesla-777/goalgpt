// =====================================================
// SEGMENT FLOW DEFINITIONS
// Her kullanıcı segmenti için akış tanımları
// =====================================================

export interface FlowStep {
    id: string;
    order: number;
    name: string;
    description: string;
    status: 'completed' | 'current' | 'pending' | 'skipped';
    completedAt?: string;
    trigger: 'automatic' | 'user_action' | 'manual' | 'time_based';
    daysToTrigger?: number;
    icon: string;
}

export interface RecommendedAction {
    id: string;
    priority: 'high' | 'medium' | 'low';
    icon: string;
    title: string;
    description: string;
    actionType: 'email' | 'push' | 'sms' | 'manual_call' | 'promo' | 'badge' | 'survey';
    buttonText: string;
}

export interface SegmentFlow {
    segmentId: string;
    segmentName: string;
    segmentIcon: string;
    segmentColor: string;
    description: string;
    steps: FlowStep[];
    recommendedActions: RecommendedAction[];
}

// =====================================================
// SEGMENT FLOW DATA
// =====================================================

export const SEGMENT_FLOWS: Record<string, SegmentFlow> = {
    // =====================================================
    // 1. NEW_USER - Yeni Kullanıcı
    // =====================================================
    new_user: {
        segmentId: 'new_user',
        segmentName: 'Yeni Kullanıcı',
        segmentIcon: '🆕',
        segmentColor: 'blue',
        description: 'Uygulamaya yeni kayıt olmuş, henüz deneme veya ödeme yapmamış kullanıcı.',
        steps: [
            {
                id: 'registration',
                order: 1,
                name: 'Kayıt',
                description: 'Hesap oluşturuldu',
                status: 'completed',
                trigger: 'automatic',
                icon: '✅'
            },
            {
                id: 'email_verification',
                order: 2,
                name: 'E-posta Doğrulama',
                description: 'E-posta adresi doğrulandı',
                status: 'pending',
                trigger: 'user_action',
                icon: '📧'
            },
            {
                id: 'profile_completion',
                order: 3,
                name: 'Profil Tamamlama',
                description: 'İsim, avatar, hedefler girildi',
                status: 'pending',
                trigger: 'user_action',
                icon: '👤'
            },
            {
                id: 'first_prediction',
                order: 4,
                name: 'İlk Tahmin',
                description: 'İlk tahmini yaptı',
                status: 'pending',
                trigger: 'user_action',
                icon: '🎯'
            },
            {
                id: 'trial_start',
                order: 5,
                name: 'Deneme Başlatma',
                description: 'Ücretsiz denemeye başladı',
                status: 'pending',
                trigger: 'user_action',
                icon: '🚀'
            }
        ],
        recommendedActions: [
            {
                id: 'welcome_email',
                priority: 'high',
                icon: '📧',
                title: 'Hoşgeldin E-postası Gönder',
                description: 'Kullanıcıya hoşgeldin mesajı ve uygulama rehberi gönder',
                actionType: 'email',
                buttonText: 'E-posta Gönder'
            },
            {
                id: 'first_prediction_push',
                priority: 'high',
                icon: '🔔',
                title: 'İlk Tahmin Bildirimi',
                description: '"İlk tahminini yap!" push bildirimi gönder',
                actionType: 'push',
                buttonText: 'Bildirim Gönder'
            },
            {
                id: 'trial_promo',
                priority: 'medium',
                icon: '🎁',
                title: 'Deneme Promokodu Gönder',
                description: '24 saat sonra hala aktif değilse ücretsiz deneme kodu gönder',
                actionType: 'promo',
                buttonText: 'Promokod Oluştur'
            }
        ]
    },

    // =====================================================
    // 2. TRIAL_USER - Deneme Kullanıcısı
    // =====================================================
    trial_user: {
        segmentId: 'trial_user',
        segmentName: 'Deneme Kullanıcısı',
        segmentIcon: '🎯',
        segmentColor: 'purple',
        description: 'Ücretsiz deneme döneminde olan kullanıcı.',
        steps: [
            {
                id: 'trial_started',
                order: 1,
                name: 'Deneme Başladı',
                description: '7 günlük deneme aktif',
                status: 'completed',
                trigger: 'automatic',
                icon: '✅'
            },
            {
                id: 'first_trial_prediction',
                order: 2,
                name: 'İlk Tahmin (Deneme)',
                description: 'Deneme sürecinde ilk tahmin',
                status: 'pending',
                trigger: 'user_action',
                icon: '🎯'
            },
            {
                id: 'active_3_days',
                order: 3,
                name: '3+ Gün Aktif',
                description: '3 gün boyunca uygulamayı kullandı',
                status: 'pending',
                trigger: 'automatic',
                daysToTrigger: 3,
                icon: '📊'
            },
            {
                id: 'premium_feature_used',
                order: 4,
                name: 'Premium Özellik Kullanımı',
                description: 'VIP özelliklerini denedi',
                status: 'pending',
                trigger: 'user_action',
                icon: '⭐'
            },
            {
                id: 'trial_ending_soon',
                order: 5,
                name: 'Deneme Bitimi Yaklaşıyor',
                description: 'Son 2 gün uyarısı',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 5,
                icon: '⚠️'
            },
            {
                id: 'conversion',
                order: 6,
                name: 'Ödeme / Dönüşüm',
                description: 'Ücretli aboneliğe geçti',
                status: 'pending',
                trigger: 'user_action',
                icon: '💳'
            }
        ],
        recommendedActions: [
            {
                id: 'trial_performance_report',
                priority: 'medium',
                icon: '📊',
                title: 'Deneme Performans Raporu',
                description: 'Kullanıcının deneme sürecindeki aktivitelerini özetle',
                actionType: 'email',
                buttonText: 'Rapor Gönder'
            },
            {
                id: 'day3_discount',
                priority: 'high',
                icon: '💰',
                title: 'Gün 3: İndirimli Teklif',
                description: '%20 indirimli abonelik teklifi gönder',
                actionType: 'push',
                buttonText: 'Teklif Gönder'
            },
            {
                id: 'trial_ending_notification',
                priority: 'high',
                icon: '⚠️',
                title: 'Deneme Bitiyor Bildirimi',
                description: 'Gün 5: "Denemen bitiyor!" uyarısı gönder',
                actionType: 'push',
                buttonText: 'Bildirim Gönder'
            },
            {
                id: 'last_chance_discount',
                priority: 'high',
                icon: '🎁',
                title: 'Son Şans İndirimi (%30)',
                description: 'Gün 6: Büyük indirimle son şans teklifi',
                actionType: 'promo',
                buttonText: 'Promokod Gönder'
            }
        ]
    },

    // =====================================================
    // 3. PAYING_CUSTOMER - Ödeme Yapan Müşteri
    // =====================================================
    paying_customer: {
        segmentId: 'paying_customer',
        segmentName: 'Ödeme Yapan Müşteri',
        segmentIcon: '💳',
        segmentColor: 'green',
        description: 'Aktif aboneliği olan ve düzenli ödeme yapan kullanıcı.',
        steps: [
            {
                id: 'first_payment',
                order: 1,
                name: 'İlk Ödeme',
                description: 'Abonelik satın alındı',
                status: 'completed',
                trigger: 'automatic',
                icon: '✅'
            },
            {
                id: 'subscription_active',
                order: 2,
                name: 'Abonelik Aktif',
                description: 'Premium özellikler açıldı',
                status: 'completed',
                trigger: 'automatic',
                icon: '✅'
            },
            {
                id: 'regular_usage',
                order: 3,
                name: 'Düzenli Kullanım',
                description: 'Haftalık 3+ giriş',
                status: 'pending',
                trigger: 'automatic',
                icon: '📊'
            },
            {
                id: 'first_renewal',
                order: 4,
                name: 'İlk Yenileme',
                description: 'İlk otomatik yenileme başarılı',
                status: 'pending',
                trigger: 'automatic',
                icon: '🔄'
            },
            {
                id: 'active_3_months',
                order: 5,
                name: '3 Ay Aktif',
                description: '3 aylık sürekli abonelik',
                status: 'pending',
                trigger: 'automatic',
                daysToTrigger: 90,
                icon: '🏆'
            },
            {
                id: 'referral_made',
                order: 6,
                name: 'Referans Getirdi',
                description: 'Arkadaş davet etti',
                status: 'pending',
                trigger: 'user_action',
                icon: '👥'
            },
            {
                id: 'yearly_upgrade',
                order: 7,
                name: 'Yıllık Plana Geçiş',
                description: 'Aylıktan yıllığa upgrade',
                status: 'pending',
                trigger: 'user_action',
                icon: '⬆️'
            }
        ],
        recommendedActions: [
            {
                id: 'success_badge',
                priority: 'medium',
                icon: '🏆',
                title: 'Başarı Rozeti Ver',
                description: 'İlk ödeme sonrası özel rozet ile kutla',
                actionType: 'badge',
                buttonText: 'Rozet Ver'
            },
            {
                id: 'monthly_report',
                priority: 'low',
                icon: '📈',
                title: 'Aylık Performans Raporu',
                description: 'Kullanıcının aylık aktivite ve başarı özeti',
                actionType: 'email',
                buttonText: 'Rapor Gönder'
            },
            {
                id: 'loyalty_discount',
                priority: 'medium',
                icon: '🎁',
                title: '3. Ay Sadakat İndirimi',
                description: 'Sadık müşterilere özel %15 yıllık plan indirimi',
                actionType: 'promo',
                buttonText: 'Teklif Gönder'
            },
            {
                id: 'referral_invite',
                priority: 'medium',
                icon: '👥',
                title: 'Referans Programı Daveti',
                description: 'Arkadaşını getir, 1 ay bedava kazan',
                actionType: 'push',
                buttonText: 'Davet Gönder'
            }
        ]
    },

    // =====================================================
    // 4. CHURNED_USER - Ayrılan/Kaybedilen Kullanıcı
    // =====================================================
    churned_user: {
        segmentId: 'churned_user',
        segmentName: 'Ayrılan Kullanıcı',
        segmentIcon: '⚠️',
        segmentColor: 'red',
        description: 'Aboneliği iptal etmiş veya ödeme yapmayı bırakmış kullanıcı.',
        steps: [
            {
                id: 'subscription_ended',
                order: 1,
                name: 'Abonelik Sona Erdi',
                description: 'Ödeme hatası veya iptal',
                status: 'completed',
                trigger: 'automatic',
                icon: '❌'
            },
            {
                id: 'winback_email_1',
                order: 2,
                name: 'Geri Kazanım E-postası #1',
                description: '"Seni özledik" e-postası',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 1,
                icon: '📧'
            },
            {
                id: 'winback_email_2',
                order: 3,
                name: 'Geri Kazanım E-postası #2',
                description: 'İndirimli teklif gönderildi',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 3,
                icon: '💰'
            },
            {
                id: 'winback_push',
                order: 4,
                name: 'Push Bildirim',
                description: 'Son şans bildirimi',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 5,
                icon: '🔔'
            },
            {
                id: 'winback_campaign',
                order: 5,
                name: 'Win-back Kampanyası',
                description: 'Büyük indirimli geri dönüş teklifi',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 7,
                icon: '🎁'
            },
            {
                id: 'returned',
                order: 6,
                name: 'Geri Döndü',
                description: 'Tekrar abone oldu',
                status: 'pending',
                trigger: 'user_action',
                icon: '🎉'
            }
        ],
        recommendedActions: [
            {
                id: 'manual_call',
                priority: 'high',
                icon: '📞',
                title: 'Manuel Arama',
                description: 'Yüksek değerli müşteri - kişisel iletişim kur',
                actionType: 'manual_call',
                buttonText: 'Arama Notu Ekle'
            },
            {
                id: 'personalized_email',
                priority: 'high',
                icon: '📧',
                title: 'Kişiselleştirilmiş E-posta',
                description: 'Admin tarafından özel mesaj gönder',
                actionType: 'email',
                buttonText: 'E-posta Yaz'
            },
            {
                id: 'winback_50_discount',
                priority: 'high',
                icon: '🎁',
                title: '%50 Geri Dönüş İndirimi',
                description: 'Büyük indirimle geri kazanmayı dene',
                actionType: 'promo',
                buttonText: '%50 Promokod'
            },
            {
                id: 'exit_survey',
                priority: 'medium',
                icon: '📝',
                title: 'Çıkış Anketi',
                description: '"Neden ayrıldınız?" anketi gönder',
                actionType: 'survey',
                buttonText: 'Anket Gönder'
            }
        ]
    },

    // =====================================================
    // 5. LOYAL_SUBSCRIBER - Sadık Abone
    // =====================================================
    loyal_subscriber: {
        segmentId: 'loyal_subscriber',
        segmentName: 'Sadık Abone',
        segmentIcon: '⭐',
        segmentColor: 'yellow',
        description: '6+ aydır kesintisiz abone olan ve düzenli kullanan kullanıcı.',
        steps: [
            {
                id: '6_months_completed',
                order: 1,
                name: '6 Ay Tamamlandı',
                description: 'Sadık abone statüsü kazandı',
                status: 'completed',
                trigger: 'automatic',
                icon: '✅'
            },
            {
                id: 'ambassador_invite',
                order: 2,
                name: 'Ambassador Daveti',
                description: 'Marka elçisi programına davet edildi',
                status: 'pending',
                trigger: 'manual',
                icon: '🎖️'
            },
            {
                id: 'vip_plus_access',
                order: 3,
                name: 'Özel İçerik Erişimi',
                description: 'VIP+ özellikler açıldı',
                status: 'pending',
                trigger: 'automatic',
                icon: '👑'
            },
            {
                id: 'yearly_anniversary',
                order: 4,
                name: 'Yıllık Dönüm',
                description: '1 yıllık abone',
                status: 'pending',
                trigger: 'automatic',
                daysToTrigger: 365,
                icon: '🎂'
            },
            {
                id: 'referral_champion',
                order: 5,
                name: 'Referans Şampiyonu',
                description: '5+ referans getirdi',
                status: 'pending',
                trigger: 'automatic',
                icon: '🏅'
            },
            {
                id: 'lifetime_vip',
                order: 6,
                name: 'Ömür Boyu VIP',
                description: 'Lifetime aboneliğe geçti',
                status: 'pending',
                trigger: 'user_action',
                icon: '💎'
            }
        ],
        recommendedActions: [
            {
                id: 'special_badge',
                priority: 'medium',
                icon: '🎖️',
                title: 'Özel Rozet ve Unvan',
                description: 'Sadık Abone rozetini ve unvanını ver',
                actionType: 'badge',
                buttonText: 'Rozet Ver'
            },
            {
                id: 'anniversary_gift',
                priority: 'high',
                icon: '🎁',
                title: 'Yıldönümü Hediyesi',
                description: '1 aylık ücretsiz uzatma veya özel içerik',
                actionType: 'promo',
                buttonText: 'Hediye Gönder'
            },
            {
                id: 'beta_access',
                priority: 'medium',
                icon: '📣',
                title: 'Beta Erken Erişim',
                description: 'Yeni özelliklere erken erişim daveti',
                actionType: 'email',
                buttonText: 'Davet Gönder'
            },
            {
                id: 'vip_support',
                priority: 'low',
                icon: '👑',
                title: 'VIP Destek Önceliği',
                description: 'Müşteri desteğinde öncelik tanımla',
                actionType: 'badge',
                buttonText: 'Öncelik Ver'
            }
        ]
    },

    // =====================================================
    // 6. INACTIVE_USER - Pasif Kullanıcı
    // =====================================================
    inactive_user: {
        segmentId: 'inactive_user',
        segmentName: 'Pasif Kullanıcı',
        segmentIcon: '💀',
        segmentColor: 'gray',
        description: 'Kayıtlı ama uzun süredir kullanmayan (30+ gün giriş yok) kullanıcı.',
        steps: [
            {
                id: '7_days_inactive',
                order: 1,
                name: '7 Gün İnaktif',
                description: 'Son girişten 7 gün geçti',
                status: 'completed',
                trigger: 'automatic',
                icon: '⚠️'
            },
            {
                id: 'reengagement_email',
                order: 2,
                name: 'Re-engagement E-postası',
                description: '"Seni özledik" e-postası gönderildi',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 7,
                icon: '📧'
            },
            {
                id: '14_days_inactive',
                order: 3,
                name: '14 Gün İnaktif',
                description: 'Ciddi inaktivite',
                status: 'pending',
                trigger: 'automatic',
                daysToTrigger: 14,
                icon: '⚠️'
            },
            {
                id: 'push_campaign',
                order: 4,
                name: 'Push Kampanyası',
                description: 'Yeni özellik duyurusu gönderildi',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 14,
                icon: '🔔'
            },
            {
                id: '30_days_inactive',
                order: 5,
                name: '30 Gün İnaktif',
                description: 'Pasif statüsüne geçti',
                status: 'pending',
                trigger: 'automatic',
                daysToTrigger: 30,
                icon: '💀'
            },
            {
                id: 'winback_offer',
                order: 6,
                name: 'Win-back Teklifi',
                description: 'Son şans indirimi gönderildi',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 30,
                icon: '🎁'
            },
            {
                id: 'reactivated',
                order: 7,
                name: 'Reaktivite',
                description: 'Tekrar aktif oldu',
                status: 'pending',
                trigger: 'user_action',
                icon: '🎉'
            }
        ],
        recommendedActions: [
            {
                id: 'important_match_push',
                priority: 'high',
                icon: '🔔',
                title: 'Önemli Maç Bildirimi',
                description: 'Takip ettiği takımın maçını hatırlat',
                actionType: 'push',
                buttonText: 'Bildirim Gönder'
            },
            {
                id: 'missed_content_email',
                priority: 'high',
                icon: '📧',
                title: '"Kaçırdıkların" E-postası',
                description: 'Son dönemdeki önemli tahminleri özetle',
                actionType: 'email',
                buttonText: 'Özet Gönder'
            },
            {
                id: 'comeback_promo',
                priority: 'medium',
                icon: '🎁',
                title: 'Geri Dönüş Promokodu',
                description: '7 günlük ücretsiz VIP erişimi',
                actionType: 'promo',
                buttonText: 'Promokod Gönder'
            },
            {
                id: 'account_summary',
                priority: 'low',
                icon: '📊',
                title: 'Hesap Özeti Raporu',
                description: 'Genel istatistikler ve başarılar özeti',
                actionType: 'email',
                buttonText: 'Rapor Gönder'
            }
        ]
    },

    // =====================================================
    // 7. TRIAL_EXPIRED - Deneme Süresi Dolmuş
    // RevenueCat: Trial ended without conversion
    // =====================================================
    trial_expired: {
        segmentId: 'trial_expired',
        segmentName: 'Deneme Bitmiş',
        segmentIcon: '⏰',
        segmentColor: 'orange',
        description: 'Deneme süresi dolmuş ama ödeme yapmamış kullanıcı.',
        steps: [
            {
                id: 'trial_ended',
                order: 1,
                name: 'Deneme Sona Erdi',
                description: '7 günlük deneme süresi doldu',
                status: 'completed',
                trigger: 'automatic',
                icon: '⏰'
            },
            {
                id: 'conversion_reminder_1',
                order: 2,
                name: 'Dönüşüm Hatırlatması #1',
                description: '"Denemen bitti, premium\'a geç!" e-postası',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 0,
                icon: '📧'
            },
            {
                id: 'special_offer',
                order: 3,
                name: 'Özel Teklif',
                description: '%40 indirimli geri dönüş teklifi',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 1,
                icon: '🎁'
            },
            {
                id: 'conversion_reminder_2',
                order: 4,
                name: 'Son Hatırlatma',
                description: 'Push bildirim ile son şans',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 3,
                icon: '🔔'
            },
            {
                id: 'converted_late',
                order: 5,
                name: 'Geç Dönüşüm',
                description: 'Sonunda abone oldu',
                status: 'pending',
                trigger: 'user_action',
                icon: '🎉'
            }
        ],
        recommendedActions: [
            {
                id: 'trial_expired_offer',
                priority: 'high',
                icon: '🎁',
                title: 'Deneme Bitimi İndirimi (%40)',
                description: 'Premium\'a geçiş için büyük indirim teklifi',
                actionType: 'promo',
                buttonText: 'Teklif Gönder'
            },
            {
                id: 'trial_expired_push',
                priority: 'high',
                icon: '🔔',
                title: 'Acil Push Bildirimi',
                description: '"Premium özelliklere erişimin kesildi!" bildirimi',
                actionType: 'push',
                buttonText: 'Bildirim Gönder'
            },
            {
                id: 'trial_feedback',
                priority: 'medium',
                icon: '📝',
                title: 'Deneme Geri Bildirimi',
                description: '"Neden abone olmadın?" anketi',
                actionType: 'survey',
                buttonText: 'Anket Gönder'
            }
        ]
    },

    // =====================================================
    // 8. GRACE_PERIOD - Ödeme Bekleniyor (Billing Issue)
    // RevenueCat: BILLING_ISSUE event
    // =====================================================
    grace_period: {
        segmentId: 'grace_period',
        segmentName: 'Ödeme Bekleniyor',
        segmentIcon: '⏳',
        segmentColor: 'orange',
        description: 'Ödeme hatası yaşayan, grace period\'da olan kullanıcı (3-16 gün süre).',
        steps: [
            {
                id: 'billing_issue',
                order: 1,
                name: 'Ödeme Hatası',
                description: 'Kart/banka sorunu tespit edildi',
                status: 'completed',
                trigger: 'automatic',
                icon: '❌'
            },
            {
                id: 'grace_started',
                order: 2,
                name: 'Grace Period Başladı',
                description: 'Kullanıcıya ek süre verildi (3-16 gün)',
                status: 'completed',
                trigger: 'automatic',
                icon: '⏳'
            },
            {
                id: 'billing_reminder_1',
                order: 3,
                name: 'Ödeme Hatırlatması #1',
                description: '"Ödeme bilgilerini güncelle" e-postası',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 0,
                icon: '📧'
            },
            {
                id: 'billing_retry_1',
                order: 4,
                name: 'Otomatik Yeniden Deneme #1',
                description: 'Sistem ödemeyi tekrar deniyor',
                status: 'pending',
                trigger: 'automatic',
                daysToTrigger: 3,
                icon: '🔄'
            },
            {
                id: 'billing_reminder_2',
                order: 5,
                name: 'Acil Ödeme Uyarısı',
                description: '"Aboneliğin iptal olacak!" bildirimi',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 7,
                icon: '🚨'
            },
            {
                id: 'billing_resolved',
                order: 6,
                name: 'Ödeme Düzeltildi',
                description: 'Kullanıcı ödeme bilgilerini güncelledi',
                status: 'pending',
                trigger: 'user_action',
                icon: '✅'
            }
        ],
        recommendedActions: [
            {
                id: 'update_payment_push',
                priority: 'high',
                icon: '💳',
                title: 'Ödeme Güncelleme Bildirimi',
                description: '"Kart bilgilerini güncelle" acil push',
                actionType: 'push',
                buttonText: 'Bildirim Gönder'
            },
            {
                id: 'payment_help_email',
                priority: 'high',
                icon: '📧',
                title: 'Ödeme Yardım E-postası',
                description: 'Adım adım kart güncelleme rehberi gönder',
                actionType: 'email',
                buttonText: 'Rehber Gönder'
            },
            {
                id: 'manual_contact',
                priority: 'medium',
                icon: '📞',
                title: 'Manuel İletişim',
                description: 'Yüksek LTV kullanıcı - telefon ile ara',
                actionType: 'manual_call',
                buttonText: 'Arama Notu Ekle'
            }
        ]
    },

    // =====================================================
    // 9. PAUSED_USER - Abonelik Duraklatılmış
    // RevenueCat: SUBSCRIPTION_PAUSED event
    // =====================================================
    paused_user: {
        segmentId: 'paused_user',
        segmentName: 'Abonelik Duraklatılmış',
        segmentIcon: '⏸️',
        segmentColor: 'slate',
        description: 'Aboneliğini duraklatmış kullanıcı (örn: tatil modu).',
        steps: [
            {
                id: 'pause_requested',
                order: 1,
                name: 'Duraklatma İstendi',
                description: 'Kullanıcı aboneliği duraklattı',
                status: 'completed',
                trigger: 'user_action',
                icon: '⏸️'
            },
            {
                id: 'pause_active',
                order: 2,
                name: 'Duraklatma Aktif',
                description: 'Premium özelliklere erişim kapalı',
                status: 'completed',
                trigger: 'automatic',
                icon: '⏸️'
            },
            {
                id: 'pause_reminder',
                order: 3,
                name: 'Devam Hatırlatması',
                description: '"Seni özledik, aboneliğini devam ettir!"',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 14,
                icon: '📧'
            },
            {
                id: 'pause_ending',
                order: 4,
                name: 'Duraklatma Bitiyor',
                description: 'Duraklatma süresi sona yaklaşıyor',
                status: 'pending',
                trigger: 'automatic',
                icon: '⏰'
            },
            {
                id: 'subscription_resumed',
                order: 5,
                name: 'Abonelik Devam Etti',
                description: 'Kullanıcı aboneliği yeniden başlattı',
                status: 'pending',
                trigger: 'user_action',
                icon: '▶️'
            }
        ],
        recommendedActions: [
            {
                id: 'resume_offer',
                priority: 'medium',
                icon: '🎁',
                title: 'Devam Etme Teşviki',
                description: 'Hemen devam ederse 1 hafta ücretsiz uzatma',
                actionType: 'promo',
                buttonText: 'Teklif Gönder'
            },
            {
                id: 'whats_new_email',
                priority: 'medium',
                icon: '📧',
                title: '"Yenilikler" E-postası',
                description: 'Duraklatma süresinde eklenen yeni özellikler',
                actionType: 'email',
                buttonText: 'E-posta Gönder'
            },
            {
                id: 'pause_reason_survey',
                priority: 'low',
                icon: '📝',
                title: 'Duraklatma Sebebi Anketi',
                description: '"Neden duraklattın?" geri bildirim',
                actionType: 'survey',
                buttonText: 'Anket Gönder'
            }
        ]
    },

    // =====================================================
    // 10. REFUNDED_USER - Geri Ödeme Yapılmış
    // RevenueCat: REFUND event
    // =====================================================
    refunded_user: {
        segmentId: 'refunded_user',
        segmentName: 'Geri Ödeme Yapılmış',
        segmentIcon: '💸',
        segmentColor: 'red',
        description: 'Geri ödeme (refund) almış kullanıcı.',
        steps: [
            {
                id: 'refund_requested',
                order: 1,
                name: 'Geri Ödeme Talebi',
                description: 'Kullanıcı refund talep etti',
                status: 'completed',
                trigger: 'user_action',
                icon: '💸'
            },
            {
                id: 'refund_processed',
                order: 2,
                name: 'Geri Ödeme Yapıldı',
                description: 'App Store/Play Store tarafından onaylandı',
                status: 'completed',
                trigger: 'automatic',
                icon: '✅'
            },
            {
                id: 'access_revoked',
                order: 3,
                name: 'Erişim Kaldırıldı',
                description: 'Premium özelliklere erişim kapatıldı',
                status: 'completed',
                trigger: 'automatic',
                icon: '🔒'
            },
            {
                id: 'refund_feedback',
                order: 4,
                name: 'Geri Bildirim',
                description: '"Neden iade istedin?" anketi',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 1,
                icon: '📝'
            },
            {
                id: 'second_chance',
                order: 5,
                name: 'İkinci Şans',
                description: 'Tekrar abone oldu (düşük ihtimal)',
                status: 'pending',
                trigger: 'user_action',
                icon: '🔄'
            }
        ],
        recommendedActions: [
            {
                id: 'refund_survey',
                priority: 'high',
                icon: '📝',
                title: 'Geri Ödeme Anketi',
                description: '"Neden iade istedin?" detaylı anket',
                actionType: 'survey',
                buttonText: 'Anket Gönder'
            },
            {
                id: 'refund_manual_review',
                priority: 'high',
                icon: '👁️',
                title: 'Manuel İnceleme',
                description: 'Kullanıcı hesabını ve aktivitesini incele',
                actionType: 'manual_call',
                buttonText: 'İnceleme Başlat'
            },
            {
                id: 'second_chance_offer',
                priority: 'low',
                icon: '🎁',
                title: 'İkinci Şans Teklifi',
                description: '%60 indirimle tekrar deneme teklifi (2 hafta sonra)',
                actionType: 'promo',
                buttonText: 'Teklif Planla'
            }
        ]
    },

    // =====================================================
    // 11. WINBACK_TARGET - Geri Kazanım Hedefi
    // Churned üzerinden belirli süre geçmiş, henüz dönmemiş
    // =====================================================
    winback_target: {
        segmentId: 'winback_target',
        segmentName: 'Geri Kazanım Hedefi',
        segmentIcon: '🎯',
        segmentColor: 'indigo',
        description: 'Uzun süredir ayrılmış, geri kazanılması hedeflenen değerli kullanıcı.',
        steps: [
            {
                id: 'churned_30_days',
                order: 1,
                name: '30+ Gün Ayrı',
                description: 'Abonelik biteli 30 gün geçti',
                status: 'completed',
                trigger: 'automatic',
                icon: '📅'
            },
            {
                id: 'winback_campaign_sent',
                order: 2,
                name: 'Win-back Kampanyası',
                description: 'Geri dönüş kampanyası gönderildi',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 30,
                icon: '📧'
            },
            {
                id: 'big_discount_offer',
                order: 3,
                name: 'Büyük İndirim Teklifi',
                description: '%60+ indirimli özel teklif',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 45,
                icon: '💰'
            },
            {
                id: 'seasonal_campaign',
                order: 4,
                name: 'Sezonsal Kampanya',
                description: 'Yılbaşı/özel gün kampanyasına dahil',
                status: 'pending',
                trigger: 'manual',
                icon: '🎄'
            },
            {
                id: 'last_resort',
                order: 5,
                name: 'Son Teklif',
                description: 'Premium 1 ay bedava deneme',
                status: 'pending',
                trigger: 'time_based',
                daysToTrigger: 90,
                icon: '🎁'
            },
            {
                id: 'won_back',
                order: 6,
                name: 'Geri Kazanıldı',
                description: 'Kullanıcı tekrar abone oldu!',
                status: 'pending',
                trigger: 'user_action',
                icon: '🏆'
            }
        ],
        recommendedActions: [
            {
                id: 'massive_discount',
                priority: 'high',
                icon: '💰',
                title: '%70 Mega İndirim',
                description: 'En büyük indirimle son şans teklifi',
                actionType: 'promo',
                buttonText: '%70 Promokod'
            },
            {
                id: 'personal_email',
                priority: 'high',
                icon: '📧',
                title: 'Kişisel E-posta',
                description: 'CEO/Founder imzalı kişisel mesaj',
                actionType: 'email',
                buttonText: 'E-posta Yaz'
            },
            {
                id: 'free_month_offer',
                priority: 'medium',
                icon: '🎁',
                title: '1 Ay Bedava Deneme',
                description: 'Karşılıksız 1 aylık premium erişim',
                actionType: 'promo',
                buttonText: 'Hediye Gönder'
            },
            {
                id: 'phone_outreach',
                priority: 'medium',
                icon: '📞',
                title: 'Telefon ile Ulaşım',
                description: 'Kişisel arama ile geri kazanma',
                actionType: 'manual_call',
                buttonText: 'Arama Planla'
            }
        ]
    }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Kullanıcının segment'ine göre akış bilgisini döndürür
 */
export function getSegmentFlow(segmentId: string): SegmentFlow | null {
    return SEGMENT_FLOWS[segmentId] || null;
}

/**
 * Tüm segment listesini döndürür
 */
export function getAllSegments(): SegmentFlow[] {
    return Object.values(SEGMENT_FLOWS);
}

/**
 * Segment ID'den segment adını döndürür
 */
export function getSegmentName(segmentId: string): string {
    return SEGMENT_FLOWS[segmentId]?.segmentName || 'Bilinmeyen Segment';
}

/**
 * Tamamlanan adım sayısını hesaplar
 */
export function getCompletedStepsCount(steps: FlowStep[]): number {
    return steps.filter(s => s.status === 'completed').length;
}

/**
 * İlerleme yüzdesini hesaplar
 */
export function getFlowProgress(steps: FlowStep[]): number {
    const completed = getCompletedStepsCount(steps);
    return Math.round((completed / steps.length) * 100);
}

/**
 * Mevcut adımı (current) bulur
 */
export function getCurrentStep(steps: FlowStep[]): FlowStep | null {
    return steps.find(s => s.status === 'current') ||
        steps.find(s => s.status === 'pending') ||
        null;
}

/**
 * Önceliğe göre sıralanmış aksiyonları döndürür
 */
export function getSortedActions(actions: RecommendedAction[]): RecommendedAction[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...actions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
