export class OrderContextClient {
  private name: string | null = null;
  private firstName: string | null = null;
  private lastName: string | null = null;
  private email: string | null = null;

  public jsonSerialize(): any {
    const data: any = {
      name: this.name,
      firstName: this.firstName,
      lastName: this.lastName,
    };
    return this.removeNullProperties(data);
  }

  private removeNullProperties(obj: any): any {
    const newObj: any = {};
    for (const prop in obj) {
      if (obj[prop] !== null) {
        newObj[prop] = obj[prop];
      }
    }
    return newObj;
  }

  getName(): string | null {
    return this.name;
  }

  setName(name: string | null): this {
    this.name = name;
    return this;
  }

  getFirstName(): string | null {
    return this.firstName;
  }

  setFirstName(firstName: string | null): this {
    this.firstName = firstName;
    return this;
  }

  getLastName(): string | null {
    return this.lastName;
  }

  setLastName(lastName: string | null): this {
    this.lastName = lastName;
    return this;
  }

  getEmail(): string | null {
    return this.email;
  }

  setEmail(email: string | null): this {
    this.email = email;
    return this;
  }
}
