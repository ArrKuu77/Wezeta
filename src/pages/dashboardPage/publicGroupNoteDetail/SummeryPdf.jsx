import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RiArrowGoBackFill } from "react-icons/ri";
import html2pdf from "html2pdf.js";

const SummeryPdf = () => {
  const navigate = useNavigate();
  const pdfRef = useRef();
  const {
    incomeData = 0,
    outcomeData = [],
    months = "",
    groupName = "",
  } = useLocation().state || {};

  // Total Outcome Calculation
  const totalOutcome = outcomeData.reduce((sum, item) => {
    const amount = parseFloat(
      item.group_detail_create_outCome_list?.amount || 0
    );
    return sum + amount;
  }, 0);

  const refundAmount = incomeData - totalOutcome;
  const handleDownloadPDF = () => {
    const opt = {
      margin: 0.5,
      filename: `${groupName}_${months}_summeryExpenses.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
    };

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      opt.html2canvas.scale = 1;
    }

    html2pdf().set(opt).from(pdfRef.current).save();
  };

  //   const handleDownloadPDF = () => {
  //     const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  //     const options = {
  //       margin: 0.5,
  //       filename: `${groupName}_${months}_report.pdf`,
  //       image: { type: "jpeg", quality: 0.98 },
  //       html2canvas: { scale: isSafari ? 1 : 2 },
  //       jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
  //     };

  //     html2pdf().set(options).from(pdfRef.current).save();
  //   };
  const summarizeByUser = (data) => {
    const summaryMap = new Map();

    data.forEach((item) => {
      const out = item.group_detail_create_outCome_list;
      if (!out) return;

      const userId = out.UploadUser_id;
      const userName = out.UploadUserName;
      const amount = parseFloat(out.amount) || 0;

      if (summaryMap.has(userId)) {
        summaryMap.get(userId).amount += amount;
      } else {
        summaryMap.set(userId, {
          UploadUser_id: userId,
          UploadUserName: userName,
          amount,
        });
      }
    });

    return [...summaryMap.values()];
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex gap-1 items-center px-2 py-1 text-xl bg-amber-700 border border-gray-600 rounded-lg mb-4"
      >
        <RiArrowGoBackFill />
        Back
      </button>

      {/* PDF Content */}
      <div
        ref={pdfRef}
        className="bg-white text-black rounded-lg shadow-md p-6 max-w-6xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-center text-yellow-600">
          Advance Claimed Form
        </h1>
        <h2 className="text-md font-bold text-center text-yellow-600 mb-4">
          {groupName} - {months} Expend Summary
        </h2>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-yellow-200 text-gray-800 font-semibold">
              <tr>
                <th className="border px-4 py-2 text-center">#</th>
                <th className="border px-4 py-2 text-left">MR Name</th>
                <th className="border px-4 py-2 text-right">Amount (MMK)</th>
              </tr>
            </thead>
            <tbody>
              {summarizeByUser(outcomeData).map((item, index) => {
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border px-4 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border px-4 py-2">{item?.UploadUserName}</td>
                    <td className="border px-4 py-2 text-right">
                      {parseFloat(item?.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                );
              })}

              {/* Total Outcome */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="border px-4 py-2 text-center">
                  Total
                </td>
                <td className="border px-4 py-2 text-right">
                  {totalOutcome.toLocaleString()}
                </td>
              </tr>

              {/* Income (Advance) */}
              <tr className="bg-blue-100 font-medium">
                <td colSpan={2} className="border px-4 py-2 text-center">
                  Advance
                </td>
                <td className="border px-4 py-2 text-right">
                  {incomeData.toLocaleString()}
                </td>
              </tr>

              {/* Refund */}
              <tr
                className={`font-semibold ${
                  refundAmount >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <td colSpan={2} className="border px-4 py-2 text-center">
                  Refund {refundAmount >= 0 ? "to" : "from"} Company
                </td>
                <td className="border px-4 py-2 text-right">
                  {Math.abs(refundAmount).toLocaleString()}
                </td>
              </tr>

              {/* Signatures */}
              <tr>
                <td colSpan={3} className="pt-16 pb-8">
                  <div className="grid grid-cols-3 gap-14">
                    {["Claimed By", "Checked By", "Approved By"].map(
                      (label) => (
                        <div key={label} className="flex flex-col items-center">
                          <div className="w-full border-t-2 border-black mb-1" />
                          <p className="text-sm whitespace-nowrap">{label}</p>
                        </div>
                      )
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Download PDF Button */}
      <div className="text-center mt-6">
        <button
          onClick={handleDownloadPDF}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded font-semibold"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default SummeryPdf;
