import PaymentForm from "./PaymentForm";

export default function SupplierPayments({ onBack }: { onBack: () => void }) {
  return (
    <PaymentForm
      onBack={onBack}
      type="payment"
      title="دفعات الموردين"
      addLabel="تسجيل دفعة"
      submitLabel="تسجيل"
      deleteConfirm="تأكيد حذف هذه الدفعة؟"
      emptyState="لا توجد دفعات"
      referenceLabel="رقم المرجع"
      amountColor="text-green-600"
    />
  );
}
