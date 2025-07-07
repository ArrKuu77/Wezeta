import html2pdf from "html2pdf.js";
import React, { useRef } from "react";
import { RiArrowGoBackFill } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router-dom";

const Testpdf = () => {
  const pdfRef = useRef(null);
  const {
    incomeData,
    outcomeData = [],
    months,
    groupName,
  } = useLocation().state || {};
  const navigate = useNavigate();

  const totalIncome = parseFloat(incomeData?.member_income || 0);
  const totalOutcome = outcomeData.reduce(
    (sum, item) =>
      sum + parseFloat(item.group_detail_create_outCome_list.amount || 0),
    0
  );
  const balance = totalIncome - totalOutcome;

  let youPaid = 0;
  let companyPaid = 0;

  outcomeData.forEach((item) => {
    const out = item.group_detail_create_outCome_list;
    if (out.UploadUser_id === incomeData.member_id) {
      youPaid += parseFloat(out.amount || 0);
    } else {
      companyPaid += parseFloat(out.amount || 0);
    }
  });

  const downloadPDF = () => {
    const opt = {
      margin: 0.5,
      filename: `${groupName}_${months}_Expenses.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) opt.html2canvas.scale = 1;

    html2pdf().set(opt).from(pdfRef.current).save();
  };

  const renderPage = (pageData, startIndex, isLastPage) => (
    <div
      key={startIndex}
      className={`mb-12 page-break ${!isLastPage ? "break-after-page" : ""}`}
      style={{ pageBreakAfter: isLastPage ? "auto" : "always" }}
    >
      <table className="w-full text-sm border border-gray-300 mt-6">
        <thead className="text-gray-800 font-semibold">
          <tr>
            <th className="border px-4 py-2 text-left">#</th>
            <th className="border px-4 py-2 text-left">KOLName</th>
            <th className="border px-4 py-2 text-left">Title and Purpose</th>
            <th className="border px-4 py-2 text-right">Amount (MMK)</th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((item, index) => {
            const out = item.group_detail_create_outCome_list;
            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2 text-center">
                  {startIndex + index + 1}
                </td>
                <td className="border px-4 py-2">{out.customerName}</td>
                <td className="border px-4 py-2">{out.category}</td>
                <td className="border px-4 py-2 text-right">
                  {parseFloat(out.amount).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const pages = [];
  const rowsPerPage = 20;
  for (let i = 0; i < outcomeData.length; i += rowsPerPage) {
    const isLast = i + rowsPerPage >= outcomeData.length;
    pages.push(renderPage(outcomeData.slice(i, i + rowsPerPage), i, isLast));
  }

  const remainder = outcomeData.length % rowsPerPage;
  const needsFooterOnNewPage =
    remainder > 17 || outcomeData.length === rowsPerPage;

  // Header to repeat above footer
  const footerHeader = (
    <div className="mb-4 text-center">
      <h1 className="text-2xl font-bold text-yellow-600">
        Advance Claimed Form
      </h1>
      <h2 className="text-md font-bold text-yellow-600">
        {groupName} - {months} Expend
      </h2>
      <p className="text-sm text-gray-700">
        Name: <span className="font-semibold">{incomeData?.member_name}</span>
      </p>
    </div>
  );

  // Footer block, can appear on same or new page
  const footerBlock = (
    <div
      className="w-full text-sm border border-gray-300 mt-6"
      style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
    >
      {needsFooterOnNewPage && footerHeader}
      <table className="w-full">
        <tbody>
          <tr className="font-medium">
            <td colSpan={3} className="border px-4 py-2 text-center">
              Total
            </td>
            <td className="border px-4 py-2 text-right">
              {youPaid.toLocaleString()}
            </td>
          </tr>
          <tr className="font-medium">
            <td colSpan={3} className="border px-4 py-2 text-center">
              Advance
            </td>
            <td className="border px-4 py-2 text-right">
              {totalIncome.toLocaleString()}
            </td>
          </tr>
          <tr className="font-semibold">
            <td colSpan={3} className="border px-4 py-2 text-center">
              Refund {balance > 0 ? "to" : "from"} company
            </td>
            <td className="border px-4 py-2 text-right">
              {Math.abs(balance).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="pt-16 pb-8">
              <div className="w-full grid grid-cols-3 gap-14">
                <div className="flex flex-col items-center">
                  <div className="w-full border-t-2 border-black mb-1"></div>
                  <p className="text-sm whitespace-nowrap">Claimed By</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-full border-t-2 border-black mb-1"></div>
                  <p className="text-sm whitespace-nowrap">Checked By</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-full border-t-2 border-black mb-1"></div>
                  <p className="text-sm whitespace-nowrap">Approved By</p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex gap-1 items-center md:px-2 px-1 py-1 md:text-md text-xl bg-amber-700 cursor-pointer border border-gray-600 text-white rounded-lg my-2"
      >
        <RiArrowGoBackFill />
      </button>

      <div
        ref={pdfRef}
        className="bg-white text-black rounded-lg shadow-md p-6 max-w-6xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-center text-yellow-600 mb-1">
          Advance Claimed Form
        </h1>
        <h2 className="text-md font-bold text-center text-yellow-600 mb-1">
          {groupName} - {months} Expend
        </h2>
        <p className="text-center text-sm text-gray-700 mb-6">
          Name: <span className="font-semibold">{incomeData?.member_name}</span>
        </p>

        <div className="overflow-x-auto">
          {pages}

          {needsFooterOnNewPage ? (
            <div style={{ pageBreakBefore: "always" }}>{footerBlock}</div>
          ) : (
            footerBlock
          )}
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={downloadPDF}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded font-semibold"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default Testpdf;
