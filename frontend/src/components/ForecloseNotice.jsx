const ForeclosedNotice = () => (
  <div className="bg-gradient-to-r from-[#3c3c3c] to-[#3c3c3c] border border-yellow-500/40 text-yellow-300 p-6 rounded-2xl shadow-lg mb-8 flex items-start gap-4">
    <svg
      className="w-8 h-8 text-yellow-400 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <div>
      <h2 className="text-xl font-semibold mb-1 text-yellow-200">
        Loan Foreclosed
      </h2>
      <p className="text-sm text-yellow-400 leading-relaxed">
        This loan has been completely paid off and marked as foreclosed. No
        further repayments are needed.
      </p>
      <p className="text-sm text-yellow-400 leading-relaxed">No actions to take.</p>
    </div>
  </div>
);

export default ForeclosedNotice;