import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// 1. Notifikasi Sukses
export const notifySuccess = (message) => {
  toast.success(message, {
    style: { border: '1px solid #28a745', padding: '16px', color: '#155724' },
    iconTheme: { primary: '#28a745', secondary: '#FFFAEE' },
  });
};

// 2. Notifikasi Error
export const notifyError = (message) => {
  toast.error(message, {
    style: { border: '1px solid #dc3545', padding: '16px', color: '#721c24' },
    iconTheme: { primary: '#dc3545', secondary: '#FFFAEE' },
  });
};

// 3. Konfirmasi (Pengganti window.confirm)
export const confirmAction = async (title, text, confirmButtonText = 'Ya, Lakukan!') => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6', // Warna biru bootstrap
    cancelButtonColor: '#d33',    // Warna merah bootstrap
    confirmButtonText: confirmButtonText,
    cancelButtonText: 'Batal',
    reverseButtons: true
  });

  return result.isConfirmed;
};

// 4. Alert Info Biasa (Pengganti alert())
export const showAlert = (title, text, icon = 'info') => {
  Swal.fire({
    title: title,
    text: text,
    icon: icon,
    confirmButtonColor: '#3085d6',
  });
};