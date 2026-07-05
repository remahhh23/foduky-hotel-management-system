import PaymentForm from "./PaymentForm";

export default function PaymentVouchers({ onBack }: { onBack: () => void }) {
  return (
    <PaymentForm
      onBack={onBack}
      type="voucher"
      title="سندات الصرف"
      addLabel="إضافة سند صرف"
      submitLabel="إضافة"
      deleteConfirm="تأكيد حذف سند الصرف؟"
      emptyState="لا توجد سندات صرف"
      referenceLabel="رقم السند"
      amountColor="text-amber-600"
    />
  );
}
