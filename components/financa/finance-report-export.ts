type FinancePeriodReport = {
  from: string;
  to: string;

  summary: {
    collectedLek: number;
    expensesLek: number;
    netLek: number;
    paymentCount: number;
    expenseCount: number;
    payingPlayers: number;
  };

  expenseCategories: {
    category: string;
    totalLek: number;
    count: number;
  }[];

  payments: {
    id: string;
    amountLek: number;
    paidAt: string;
    notes: string | null;

    player: {
      id: string;
      firstName: string;
      lastName: string;
    };

    charge: {
      id: string;
      title: string;
    };
  }[];

  expenses: {
    id: string;
    category: string;
    title: string;
    amountLek: number;
    expenseDate: string;
    description: string | null;
    notes: string | null;
  }[];
};

const CATEGORY_LABELS: Record<string, string> = {
  SALARY: "Paga",
  RENT: "Qira",
  EQUIPMENT: "Pajisje",
  TRANSPORT: "Transport",
  MEDICAL: "Mjekesore",
  TOURNAMENT: "Turne",
  UTILITIES: "Sherbime",
  MARKETING: "Marketing",
  OTHER: "Te tjera",
};

function money(value: number) {
  return `${new Intl.NumberFormat("sq-AL").format(value)} Lek`;
}

function fileSafeDate(value: string) {
  return value.replace(/[^0-9-]/g, "");
}

function dateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function downloadFinanceReportPdf(
  report: FinancePeriodReport
) {
  const {
    PDFDocument,
    StandardFonts,
    rgb,
  } = await import("pdf-lib");

  const pdfDoc = await PDFDocument.create();

  const regularFont =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const boldFont =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

  const pageSize: [number, number] = [
    595.28,
    841.89,
  ];

  const margin = 46;
  const lineHeight = 15;

  let page = pdfDoc.addPage(pageSize);
  let y = page.getHeight() - margin;

  function newPage() {
    page = pdfDoc.addPage(pageSize);
    y = page.getHeight() - margin;
  }

  function ensureSpace(height = 30) {
    if (y - height < margin) {
      newPage();
    }
  }

  function drawText(
    text: string,
    options?: {
      size?: number;
      bold?: boolean;
      x?: number;
      gapAfter?: number;
    }
  ) {
    const size = options?.size ?? 10;
    const font =
      options?.bold
        ? boldFont
        : regularFont;

    ensureSpace(size + 8);

    page.drawText(text, {
      x: options?.x ?? margin,
      y,
      size,
      font,
      color: rgb(
        0.12,
        0.16,
        0.23
      ),
    });

    y -=
      size +
      (options?.gapAfter ?? 6);
  }

  function sectionTitle(text: string) {
    y -= 6;

    drawText(text, {
      size: 13,
      bold: true,
      gapAfter: 9,
    });
  }

  function divider() {
    ensureSpace(12);

    page.drawLine({
      start: {
        x: margin,
        y,
      },
      end: {
        x:
          page.getWidth() -
          margin,
        y,
      },
      thickness: 0.7,
      color: rgb(
        0.84,
        0.87,
        0.91
      ),
    });

    y -= 14;
  }

  drawText(
    "Akademia Sportive",
    {
      size: 11,
      bold: true,
      gapAfter: 8,
    }
  );

  drawText(
    "Raport financiar",
    {
      size: 22,
      bold: true,
      gapAfter: 10,
    }
  );

  drawText(
    `Periudha: ${report.from} - ${report.to}`,
    {
      size: 10,
      gapAfter: 14,
    }
  );

  divider();

  sectionTitle(
    "Permbledhje financiare"
  );

  drawText(
    `Arketime: ${money(
      report.summary.collectedLek
    )}`
  );

  drawText(
    `Shpenzime: ${money(
      report.summary.expensesLek
    )}`
  );

  drawText(
    `Fitimi neto: ${money(
      report.summary.netLek
    )}`
  );

  drawText(
    `Pagesa: ${report.summary.paymentCount}`
  );

  drawText(
    `Shpenzime te regjistruara: ${report.summary.expenseCount}`
  );

  drawText(
    `Sportiste pagues: ${report.summary.payingPlayers}`
  );

  divider();

  sectionTitle(
    "Shpenzimet sipas kategorise"
  );

  if (
    report.expenseCategories.length === 0
  ) {
    drawText(
      "Nuk ka shpenzime ne kete periudhe."
    );
  } else {
    for (
      const item
      of report.expenseCategories
    ) {
      drawText(
        `${CATEGORY_LABELS[item.category] ?? item.category}: ${money(
          item.totalLek
        )} (${item.count})`
      );
    }
  }

  divider();

  sectionTitle(
    "Pagesat e periudhes"
  );

  if (report.payments.length === 0) {
    drawText(
      "Nuk ka pagesa ne kete periudhe."
    );
  } else {
    for (
      const payment
      of report.payments
    ) {
      ensureSpace(
        lineHeight * 3
      );

      drawText(
        `${payment.player.firstName} ${payment.player.lastName}`,
        {
          bold: true,
          gapAfter: 4,
        }
      );

      drawText(
        `${payment.charge.title} | ${dateLabel(
          payment.paidAt
        )} | ${money(
          payment.amountLek
        )}`,
        {
          size: 9,
          gapAfter: 8,
        }
      );
    }
  }

  divider();

  sectionTitle(
    "Shpenzimet e periudhes"
  );

  if (report.expenses.length === 0) {
    drawText(
      "Nuk ka shpenzime ne kete periudhe."
    );
  } else {
    for (
      const expense
      of report.expenses
    ) {
      ensureSpace(
        lineHeight * 3
      );

      drawText(
        expense.title,
        {
          bold: true,
          gapAfter: 4,
        }
      );

      drawText(
        `${CATEGORY_LABELS[expense.category] ?? expense.category} | ${dateLabel(
          expense.expenseDate
        )} | ${money(
          expense.amountLek
        )}`,
        {
          size: 9,
          gapAfter: 8,
        }
      );
    }
  }

  const pdfBytes =
    await pdfDoc.save();

  const blob = new Blob(
    [pdfBytes],
    {
      type: "application/pdf",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download =
    `raport-financiar-${fileSafeDate(
      report.from
    )}-${fileSafeDate(
      report.to
    )}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function printFinanceReport(
  report: FinancePeriodReport
) {
  const printWindow =
    window.open(
      "",
      "_blank"
    );

  if (!printWindow) {
    throw new Error(
      "Dritarja e printimit u bllokua nga shfletuesi."
    );
  }

  const categories =
    report.expenseCategories.length
      ? report.expenseCategories
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(
                  CATEGORY_LABELS[item.category] ??
                    item.category
                )}</td>
                <td>${escapeHtml(
                  item.count
                )}</td>
                <td class="amount">${escapeHtml(
                  money(item.totalLek)
                )}</td>
              </tr>
            `
          )
          .join("")
      : `
        <tr>
          <td colspan="3" class="empty">
            Nuk ka shpenzime në këtë periudhë.
          </td>
        </tr>
      `;

  const payments =
    report.payments.length
      ? report.payments
          .map(
            (payment) => `
              <tr>
                <td>${escapeHtml(
                  `${payment.player.firstName} ${payment.player.lastName}`
                )}</td>
                <td>${escapeHtml(
                  payment.charge.title
                )}</td>
                <td>${escapeHtml(
                  dateLabel(payment.paidAt)
                )}</td>
                <td class="amount">${escapeHtml(
                  money(payment.amountLek)
                )}</td>
              </tr>
            `
          )
          .join("")
      : `
        <tr>
          <td colspan="4" class="empty">
            Nuk ka pagesa në këtë periudhë.
          </td>
        </tr>
      `;

  const expenses =
    report.expenses.length
      ? report.expenses
          .map(
            (expense) => `
              <tr>
                <td>${escapeHtml(
                  expense.title
                )}</td>
                <td>${escapeHtml(
                  CATEGORY_LABELS[
                    expense.category
                  ] ??
                    expense.category
                )}</td>
                <td>${escapeHtml(
                  dateLabel(
                    expense.expenseDate
                  )
                )}</td>
                <td class="amount">${escapeHtml(
                  money(expense.amountLek)
                )}</td>
              </tr>
            `
          )
          .join("")
      : `
        <tr>
          <td colspan="4" class="empty">
            Nuk ka shpenzime në këtë periudhë.
          </td>
        </tr>
      `;

  printWindow.document.write(`
    <!doctype html>
    <html lang="sq">
      <head>
        <meta charset="utf-8" />
        <title>Raport financiar ${escapeHtml(
          report.from
        )} - ${escapeHtml(
          report.to
        )}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 36px;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #ffffff;
          }

          .header {
            margin-bottom: 26px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
          }

          .eyebrow {
            margin: 0 0 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #6d28d9;
          }

          h1 {
            margin: 0;
            font-size: 28px;
          }

          .period {
            margin-top: 8px;
            color: #64748b;
            font-size: 13px;
          }

          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 28px;
          }

          .stat {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
          }

          .stat-label {
            font-size: 11px;
            color: #64748b;
          }

          .stat-value {
            margin-top: 5px;
            font-size: 17px;
            font-weight: 700;
          }

          h2 {
            margin: 28px 0 10px;
            font-size: 16px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }

          th,
          td {
            padding: 8px 7px;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #f8fafc;
            font-weight: 700;
          }

          .amount {
            text-align: right;
            white-space: nowrap;
            font-weight: 700;
          }

          .empty {
            text-align: center;
            color: #64748b;
            padding: 18px;
          }

          @media print {
            body {
              padding: 0;
            }

            @page {
              size: A4;
              margin: 15mm;
            }

            tr {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        <div class="header">
          <p class="eyebrow">
            Akademia Sportive
          </p>

          <h1>
            Raport financiar
          </h1>

          <div class="period">
            Periudha:
            ${escapeHtml(report.from)}
            -
            ${escapeHtml(report.to)}
          </div>
        </div>

        <div class="summary">
          <div class="stat">
            <div class="stat-label">Arkëtime</div>
            <div class="stat-value">
              ${escapeHtml(
                money(
                  report.summary
                    .collectedLek
                )
              )}
            </div>
          </div>

          <div class="stat">
            <div class="stat-label">Shpenzime</div>
            <div class="stat-value">
              ${escapeHtml(
                money(
                  report.summary
                    .expensesLek
                )
              )}
            </div>
          </div>

          <div class="stat">
            <div class="stat-label">Fitimi neto</div>
            <div class="stat-value">
              ${escapeHtml(
                money(
                  report.summary.netLek
                )
              )}
            </div>
          </div>

          <div class="stat">
            <div class="stat-label">Pagesa</div>
            <div class="stat-value">
              ${escapeHtml(
                report.summary
                  .paymentCount
              )}
            </div>
          </div>

          <div class="stat">
            <div class="stat-label">Shpenzime të regjistruara</div>
            <div class="stat-value">
              ${escapeHtml(
                report.summary
                  .expenseCount
              )}
            </div>
          </div>

          <div class="stat">
            <div class="stat-label">Sportistë pagues</div>
            <div class="stat-value">
              ${escapeHtml(
                report.summary
                  .payingPlayers
              )}
            </div>
          </div>
        </div>

        <h2>
          Shpenzimet sipas kategorisë
        </h2>

        <table>
          <thead>
            <tr>
              <th>Kategoria</th>
              <th>Regjistrime</th>
              <th class="amount">Shuma</th>
            </tr>
          </thead>
          <tbody>
            ${categories}
          </tbody>
        </table>

        <h2>
          Pagesat e periudhës
        </h2>

        <table>
          <thead>
            <tr>
              <th>Sportisti</th>
              <th>Detyrimi</th>
              <th>Data</th>
              <th class="amount">Shuma</th>
            </tr>
          </thead>
          <tbody>
            ${payments}
          </tbody>
        </table>

        <h2>
          Shpenzimet e periudhës
        </h2>

        <table>
          <thead>
            <tr>
              <th>Titulli</th>
              <th>Kategoria</th>
              <th>Data</th>
              <th class="amount">Shuma</th>
            </tr>
          </thead>
          <tbody>
            ${expenses}
          </tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.addEventListener(
    "load",
    () => {
      printWindow.focus();
      printWindow.print();
    },
    {
      once: true,
    }
  );
}
