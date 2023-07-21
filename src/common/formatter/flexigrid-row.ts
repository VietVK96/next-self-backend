export class FlexigridRow {
  private _id: any;
  private _cells: any[] = [];
  private _className: string[] = [];

  addClassName(className: string): void {
    this._className.push(className);
  }

  getClassName(): string[] {
    return this._className;
  }

  /**
   * Thay đổi giá trị của id
   * @param id
   */
  setId(id: any): void {
    this._id = id;
  }

  /**
   * Thêm một ô (cell) vào hàng
   * @param cell
   */
  addCell(cell: any): void {
    this._cells.push(cell);
  }

  /**
   * Trả về thông tin của hàng
   */
  expose(): any {
    const output: any = {
      id: this._id,
      cell: this._cells,
    };
    if (this._className.length > 0) {
      output.className = this._className;
    }
    return output;
  }
}
