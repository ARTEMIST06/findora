import re

with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

# Add useEffect and state for priceHistory
code = code.replace(
    "import React, { useState } from 'react';",
    "import React, { useState, useEffect } from 'react';"
)

code = code.replace(
    "import { formatINR, formatRelativeTime } from '../../utils/formatters';",
    "import { formatINR, formatRelativeTime } from '../../utils/formatters';\nimport { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';"
)

state_declaration = """
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'history' | 'description'>('specs');
  const [priceAlertEmail, setPriceAlertEmail] = useState('');
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);

  useEffect(() => {
    if (product) {
      store.getPriceHistory(product.id).then(setPriceHistory);
    }
  }, [product?.id]);
"""

# Replace the old state declarations + priceHistory sync
old_state = """  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'history' | 'description'>('specs');
  const [priceAlertEmail, setPriceAlertEmail] = useState('');
  const [alertSubmitted, setAlertSubmitted] = useState(false);"""

code = code.replace(old_state, state_declaration.strip())

code = code.replace("const priceHistory = store.getPriceHistory(product.id);", "")

# Now replace the price history rendering with Recharts
history_render_old = """            {/* Price timeline points visualization */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {priceHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-slate-500">{item.date}</span>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-slate-900">
                      {formatINR(item.price)}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">at {item.storeName}</span>
                  </div>
                </div>
              ))}
            </div>"""

history_render_new = """            {/* Price timeline points visualization */}
            <div className="pt-2 w-full h-64">
              {priceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...priceHistory].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="recordedAt" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      dy={10}
                    />
                    <YAxis 
                      tickFormatter={(val) => `₹${val}`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatINR(value), 'Price']}
                      labelFormatter={(label) => new Date(label).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  <TrendingDown className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No price history available yet</p>
                  <p className="text-xs mt-1">Price history will appear as Findora tracks this product over time.</p>
                </div>
              )}
            </div>"""

code = code.replace(history_render_old.strip(), history_render_new.strip())

with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
    f.write(code)

print("done patching product detail")
