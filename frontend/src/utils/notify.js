import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// 1. Notifikasi Sukses
export const notifySuccess = (message) => {
  toast.success(message, {
    style: { 
      background: '#161720',
      border: '1px solid #22c55e', 
      padding: '12px 16px', 
      color: '#f1f5f9',
      fontSize: '13.5px',
      borderRadius: '10px'
    },
    iconTheme: { primary: '#22c55e', secondary: '#161720' },
  });
};

// 2. Notifikasi Error
export const notifyError = (message) => {
  toast.error(message, {
    style: { 
      background: '#161720',
      border: '1px solid #ef4444', 
      padding: '12px 16px', 
      color: '#f1f5f9',
      fontSize: '13.5px',
      borderRadius: '10px'
    },
    iconTheme: { primary: '#ef4444', secondary: '#161720' },
  });
};

// 3. Konfirmasi (Pengganti window.confirm)
export const confirmAction = async (title, text, confirmButtonText = 'Ya, Lakukan!') => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    background: '#161720',
    color: '#f1f5f9',
    width: '320px',
    padding: '1.25rem',
    confirmButtonColor: '#d8a744',
    cancelButtonColor: '#222433',
    confirmButtonText: confirmButtonText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
    customClass: {
      popup: 'custom-swal-popup',
      title: 'custom-swal-title',
      htmlContainer: 'custom-swal-text',
      confirmButton: 'custom-swal-confirm',
      cancelButton: 'custom-swal-cancel',
      icon: 'custom-swal-icon'
    }
  });

  return result.isConfirmed;
};

// 4. Alert Info Biasa (Pengganti alert()) - Lebih Kecil & Bagus (Dark Theme & Gold Accent)
export const showAlert = (title, text, icon = 'info') => {
  return Swal.fire({
    title: title,
    text: text || '',
    icon: icon,
    background: '#161720',
    color: '#f1f5f9',
    width: '300px',
    padding: '1.2rem',
    confirmButtonColor: '#d8a744',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'custom-swal-popup',
      title: 'custom-swal-title',
      htmlContainer: 'custom-swal-text',
      confirmButton: 'custom-swal-confirm',
      icon: 'custom-swal-icon'
    }
  });
};
