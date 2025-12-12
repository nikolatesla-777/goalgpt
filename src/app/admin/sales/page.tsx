
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SalesPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [generatedLink, setGeneratedLink] = useState('')

    // Hardcoded products for now (later fetch from Stripe)
    const PRODUCTS = [
        {
            id: 'monthly',
            name: 'Premium (Aylık)',
            price: '199.99 TL',
            priceId: 'price_1QrdqaF6efe04a03J1'
        },
        {
            id: 'yearly',
            name: 'Premium (Yıllık)',
            price: '1999.99 TL',
            priceId: 'price_1QrdqaF6efe04a03J2'
        },
        {
            id: 'weekly',
            name: 'Haftalık VIP Üyelik',
            description: '7 Günlük Tam Erişim',
            price: '199.99₺',
            priceId: 'price_1SdVRQJXZwcCGJkYQGOIuESH'
        },
    ]

    const handleCreateLink = async (priceId: string) => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    successUrl: window.location.origin + '/success',
                    cancelUrl: window.location.origin + '/cancel'
                })
            })
            const data = await res.json()
            if (data.url) {
                setGeneratedLink(data.url)
                // Copy to clipboard
                navigator.clipboard.writeText(data.url)
                alert('Ödeme Linki Kopyalandı!')
            }
        } catch (e) {
            console.error(e)
            alert('Hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Web Satış & Paketler</h1>
                <p className="text-slate-500">Stripe üzerinden web satışı yapmak için ödeme linki oluşturun.</p>
            </div>

            {/* Product Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {PRODUCTS.map(product => (
                    <div key={product.id} className="p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{product.name}</h3>
                                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {product.price}
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                💳
                            </div>
                        </div>

                        <button
                            onClick={() => handleCreateLink(product.priceId)}
                            disabled={isLoading}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? 'Link Oluşturuluyor...' : 'Ödeme Linki Oluştur'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Generated Link Result */}
            {generatedLink && (
                <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl mb-8 break-all">
                    <strong>Oluşturulan Link (Panoya Kopyalandı):</strong><br />
                    <a href={generatedLink} target="_blank" className="underline">{generatedLink}</a>
                </div>
            )}

            {/* Instructions */}
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold mb-3">Nasıl Çalışır?</h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
                    <li>Yukarıdan bir paket seçip "Link Oluştur" diyin.</li>
                    <li>Oluşan linki müşteriye (Whatsapp/Email) gönderin.</li>
                    <li>Müşteri ödemeyi tamamladığında <strong>otomatik olarak</strong> Premium üyeliği aktif olur.</li>
                    <li>Mobil uygulamaya girdiğinde "Restore Purchase" yapmasına gerek kalmadan açılır.</li>
                </ol>
            </div>
        </div>
    )
}
