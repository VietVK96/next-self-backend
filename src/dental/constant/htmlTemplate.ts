export const facturePdfFooter = (show: boolean) => {
  return `
  <div style="width:100%;margin-right:5mm;margin-left:5mm;display:flex;justify-content: space-between;">
    <span style="font-size: 10px; font-style: italic;">
     ${
       show
         ? ' Membre d’une Association Agréée par l’Administration Fiscale acceptant à ce titre le règlement des honoraires par carte bancaire ou par chèques libellés à son nom.'
         : ''
     }
    </span>
    ${
      show
        ? `<span style="font-size: 10px;" class = "pageNumber"></span>`
        : `<div style="font-size: 10px;">Page <span class="pageNumber"></span> sur <span class="totalPages"></span></div>`
    }
  </div>
  `;
};

export const QuotationMutualPdfFooter = (reference: string) => {
  return `
  <div style="width:100%; display:flex; gap: 5px;justify-content: space-between;font-size: 10px; margin-right:5mm; margin-left:5mm">
    <div>
        ${reference}
    </div>
    <div>
      Page <span class="pageNumber"></span> sur <span class="totalPages"></span>
    </div>
  </div>
  `;
};
