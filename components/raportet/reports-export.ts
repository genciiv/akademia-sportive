export type ReportsExportData = {
  generatedAt: string;

  access: {
    sports: boolean;
    finance: boolean;
  };

  sports: {
    players: number;
    teams: number;
    coaches: number;
    trainingSessions: number;
    matches: number;
  };

  finance: {
    totalCollected: number;
    collectedThisMonth: number;
    totalExpenses: number;
    expensesThisMonth: number;
    netProfit: number;
    netProfitThisMonth: number;
    totalCharges: number;
    totalOutstanding: number;
    playersWithDebt: number;
    paymentCount: number;
    expenseCount: number;
  };

  periodReport: {
    from: string;
    to: string;

    sports: {
      trainingSessions: number;
      matches: number;
    };

    finance: {
      collectedLek: number;
      expensesLek: number;
      netLek: number;
      paymentCount: number;
      expenseCount: number;
    };
  } | null;
};

function money(value: number) {
  return `${new Intl.NumberFormat(
    "sq-AL"
  ).format(value)} Lek`;
}

function pdfSafe(value: unknown) {
  return String(value ?? "")
    .replace(/ë/g, "e")
    .replace(/Ë/g, "E")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generatedLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "sq-AL",
    {
      dateStyle: "long",
      timeStyle: "short",
    }
  ).format(date);
}

function periodLabel(
  from: string,
  to: string
) {
  function format(value: string) {
    const [year, month, day] =
      value.split("-").map(Number);

    const date = new Date(
      year,
      month - 1,
      day
    );

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "sq-AL",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ).format(date);
  }

  return `${format(from)} – ${format(to)}`;
}

function requirePeriod(
  data: ReportsExportData
) {
  if (!data.periodReport) {
    throw new Error(
      "Raporti i periudhës nuk është i disponueshëm."
    );
  }

  return data.periodReport;
}

export async function downloadReportsPdf(
  data: ReportsExportData
) {
  const report =
    requirePeriod(data);

  const {
    PDFDocument,
    StandardFonts,
    rgb,
  } = await import("pdf-lib");

  const pdfDoc =
    await PDFDocument.create();

  const regular =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const LEFT = 48;
  const RIGHT = 48;
  const BOTTOM = 48;

  let page = pdfDoc.addPage([
    PAGE_WIDTH,
    PAGE_HEIGHT,
  ]);

  let y = PAGE_HEIGHT - 50;

  function newPage() {
    page = pdfDoc.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

    y = PAGE_HEIGHT - 50;
  }

  function ensureSpace(height: number) {
    if (y - height < BOTTOM) {
      newPage();
    }
  }

  function text(
    value: unknown,
    options?: {
      size?: number;
      isBold?: boolean;
      indent?: number;
      gap?: number;
    }
  ) {
    const size =
      options?.size ?? 10;

    const gap =
      options?.gap ?? 17;

    const indent =
      options?.indent ?? 0;

    ensureSpace(gap + 4);

    page.drawText(
      pdfSafe(value),
      {
        x: LEFT + indent,
        y,
        size,
        font:
          options?.isBold
            ? bold
            : regular,
        color: rgb(
          0.12,
          0.16,
          0.23
        ),
        maxWidth:
          PAGE_WIDTH -
          LEFT -
          RIGHT -
          indent,
      }
    );

    y -= gap;
  }

  function section(title: string) {
    ensureSpace(42);

    y -= 8;

    page.drawLine({
      start: {
        x: LEFT,
        y,
      },
      end: {
        x: PAGE_WIDTH - RIGHT,
        y,
      },
      thickness: 0.7,
      color: rgb(
        0.88,
        0.9,
        0.93
      ),
    });

    y -= 22;

    text(
      title,
      {
        size: 14,
        isBold: true,
        gap: 22,
      }
    );
  }

  text(
    "Akademia Sportive",
    {
      size: 18,
      isBold: true,
      gap: 24,
    }
  );

  text(
    "Raport i periudhes",
    {
      size: 24,
      isBold: true,
      gap: 30,
    }
  );

  text(
    `Periudha: ${periodLabel(
      report.from,
      report.to
    )}`,
    {
      size: 11,
      isBold: true,
      gap: 19,
    }
  );

  text(
    `Gjeneruar: ${generatedLabel(
      data.generatedAt
    )}`,
    {
      size: 9,
      gap: 22,
    }
  );

  if (data.access.sports) {
    section(
      "Aktiviteti sportiv"
    );

    text(
      `Seanca stervitore: ${report.sports.trainingSessions}`
    );

    text(
      `Ndeshje: ${report.sports.matches}`
    );
  }

  if (data.access.finance) {
    section(
      "Rezultati financiar"
    );

    text(
      `Arketime: ${money(
        report.finance.collectedLek
      )}`
    );

    text(
      `Shpenzime: ${money(
        report.finance.expensesLek
      )}`
    );

    text(
      `Rezultati neto: ${money(
        report.finance.netLek
      )}`
    );

    text(
      `Pagesa te regjistruara: ${report.finance.paymentCount}`
    );

    text(
      `Shpenzime te regjistruara: ${report.finance.expenseCount}`
    );
  }

  ensureSpace(50);

  y -= 18;

  page.drawLine({
    start: {
      x: LEFT,
      y,
    },
    end: {
      x: PAGE_WIDTH - RIGHT,
      y,
    },
    thickness: 0.7,
    color: rgb(
      0.88,
      0.9,
      0.93
    ),
  });

  y -= 24;

  text(
    "Gjeneruar nga sistemi Akademia Sportive",
    {
      size: 8,
      gap: 12,
    }
  );

  const bytes =
    await pdfDoc.save();

  const blob = new Blob(
    [new Uint8Array(bytes)],
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
    `raport-${report.from}-${report.to}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function printReports(
  data: ReportsExportData
) {
  const report =
    requirePeriod(data);

  const printWindow =
    window.open(
      "",
      "_blank"
    );

  if (!printWindow) {
    throw new Error(
      "Dritarja e printimit nuk mund të hapej."
    );
  }

  const sportsHtml =
    data.access.sports
      ? `
        <section>
          <h2>Aktiviteti sportiv</h2>

          <div class="grid">
            <div class="card">
              <span>Seanca stërvitore</span>
              <strong>
                ${report.sports.trainingSessions}
              </strong>
            </div>

            <div class="card">
              <span>Ndeshje</span>
              <strong>
                ${report.sports.matches}
              </strong>
            </div>
          </div>
        </section>
      `
      : "";

  const financeHtml =
    data.access.finance
      ? `
        <section>
          <h2>Rezultati financiar</h2>

          <div class="grid">
            <div class="card">
              <span>Arkëtime</span>

              <strong>
                ${escapeHtml(
                  money(
                    report.finance
                      .collectedLek
                  )
                )}
              </strong>
            </div>

            <div class="card">
              <span>Shpenzime</span>

              <strong>
                ${escapeHtml(
                  money(
                    report.finance
                      .expensesLek
                  )
                )}
              </strong>
            </div>

            <div class="card">
              <span>Rezultati neto</span>

              <strong>
                ${escapeHtml(
                  money(
                    report.finance
                      .netLek
                  )
                )}
              </strong>
            </div>

            <div class="card">
              <span>Pagesa të regjistruara</span>

              <strong>
                ${report.finance.paymentCount}
              </strong>
            </div>

            <div class="card">
              <span>Shpenzime të regjistruara</span>

              <strong>
                ${report.finance.expenseCount}
              </strong>
            </div>
          </div>
        </section>
      `
      : "";

  printWindow.document.write(`
    <!doctype html>

    <html lang="sq">
      <head>
        <meta charset="utf-8" />

        <title>
          Raport i periudhës
        </title>

        <style>
          @page {
            size: A4;
            margin: 18mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            color: #0f172a;
            background: #ffffff;
          }

          header {
            padding-bottom: 20px;
            border-bottom: 1px solid #e2e8f0;
          }

          .brand {
            font-size: 14px;
            font-weight: 700;
            color: #6d28d9;
          }

          h1 {
            margin: 6px 0 0;
            font-size: 26px;
          }

          .period {
            margin-top: 12px;

            display: inline-block;

            padding: 7px 11px;

            border-radius: 10px;
            background: #f5f3ff;

            font-size: 12px;
            font-weight: 700;
            color: #5b21b6;
          }

          .date {
            margin-top: 9px;
            font-size: 11px;
            color: #64748b;
          }

          section {
            margin-top: 28px;
          }

          h2 {
            margin: 0 0 14px;
            font-size: 17px;
          }

          .grid {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );

            gap: 10px;
          }

          .card {
            padding: 14px;

            border:
              1px solid #e2e8f0;

            border-radius: 12px;

            background: #fafafa;
          }

          .card span {
            display: block;

            margin-bottom: 6px;

            font-size: 11px;
            color: #64748b;
          }

          .card strong {
            font-size: 16px;
          }

          footer {
            margin-top: 32px;
            padding-top: 14px;

            border-top:
              1px solid #e2e8f0;

            font-size: 10px;
            color: #94a3b8;
          }
        </style>
      </head>

      <body>
        <header>
          <div class="brand">
            Akademia Sportive
          </div>

          <h1>
            Raport i periudhës
          </h1>

          <div class="period">
            ${escapeHtml(
              periodLabel(
                report.from,
                report.to
              )
            )}
          </div>

          <div class="date">
            Gjeneruar:
            ${escapeHtml(
              generatedLabel(
                data.generatedAt
              )
            )}
          </div>
        </header>

        ${sportsHtml}
        ${financeHtml}

        <footer>
          Gjeneruar nga sistemi
          Akademia Sportive
        </footer>
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