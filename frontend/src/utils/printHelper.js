export const printReceipt = (order, type = 'customer') => {
  if (!order) return;

  const isKitchen = type === 'kitchen';

  // Helper untuk format angka
  const formatRp = (num) => parseInt(num || 0).toLocaleString('id-ID');

  const htmlContent = `
    <html>
      <head>
        <title>Cetak Nota - ${order.id} - ${isKitchen ? 'Dapur' : 'Pelanggan'}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; color: #000; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .meta { font-size: 12px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th { text-align: left; border-bottom: 1px solid #000; }
          td { vertical-align: top; padding: 2px 0; }
          .qty { width: 10%; font-weight: bold; }
          .name { width: ${isKitchen ? '90%' : '60%'}; }
          .price { width: 30%; text-align: right; display: ${isKitchen ? 'none' : 'table-cell'}; }
          .total { border-top: 1px dashed #000; padding-top: 5px; text-align: right; display: ${isKitchen ? 'none' : 'block'}; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; }
          
          .kitchen-text { font-size: 14px; font-weight: bold; }
          .note { color: red; font-size: 11px; }
          .variant { color: #555; font-size: 11px; font-style: italic; }
        </style>
      </head>
      <body>
        
        <div class="header">
          <div class="title">W.O.W</div>
          <div>Warmindo Order Wae</div>
          <small>${isKitchen ? '--- TIKET DAPUR ---' : '--- NOTA PESANAN ---'}</small>
        </div>

        <div class="meta">
          <div>No: #${order.id}</div>
          <div>Tgl: ${new Date(order.created_at).toLocaleString('id-ID')}</div>
          <div style="font-weight: bold; font-size: 14px;">Meja: ${order.table_number}</div>
          <div>Nama: ${order.customer_name || '-'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="qty">Q</th>
              <th class="name">Item</th>
              ${!isKitchen ? '<th class="price" style="text-align:right">Rp</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => {
                
                // --- PERBAIKAN LOGIKA HARGA DI SINI ---
                
                // 1. Ambil harga dasar (pastikan angka)
                const basePrice = parseFloat(item.price_at_order || item.price || 0);
                
                // 2. Hitung total harga varian (jika ada)
                // Kita looping array variants dan jumlahkan variant_price-nya
                const variantsTotal = (item.variants && Array.isArray(item.variants))
                ? item.variants.reduce((sum, v) => sum + parseFloat(v.variant_price || 0), 0)
                : 0;

                // 3. Rumus: (Harga Dasar + Total Varian) * Jumlah Porsi
                const singleItemPrice = basePrice + variantsTotal;
                const subtotal = singleItemPrice * item.quantity;
                
                // ---------------------------------------

                return `
                <tr>
                    <td class="qty ${isKitchen ? 'kitchen-text' : ''}">${item.quantity}x</td>
                    <td class="name">
                    <div class="${isKitchen ? 'kitchen-text' : ''}">${item.product_name}</div>
                    
                    ${item.variants ? `
                        <div class="variant">
                        + ${Array.isArray(item.variants) 
                            ? item.variants.map(v => `${v.variant_name} (${formatRp(v.variant_price)})`).join(', ') 
                            : typeof item.variants === 'string' ? item.variants : ''
                            }
                        </div>` : ''
                    }

                    ${item.notes ? `<div class="note">Note: ${item.notes}</div>` : ''}
                    </td>
                    
                    ${!isKitchen ? `
                    <td class="price">
                        ${formatRp(subtotal)}
                    </td>` : ''
                    }
                </tr>
                `;
            }).join('')}
          </tbody>
        </table>

        ${!isKitchen ? `
          <div class="total">
            <div style="font-weight: bold; font-size: 14px;">
              Total: Rp ${formatRp(order.total_amount)}
            </div>
            <div>Status: ${order.payment_status}</div>
          </div>
        ` : ''}

        <div class="footer">
          ${isKitchen 
            ? '<strong>SEGERA DIPROSES!</strong>' 
            : '<div>Terima Kasih!</div><div>Password Wifi: miegoreng123</div>'
          }
        </div>

      </body>
    </html>
  `;

  const printWindow = window.open('', '', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }
};