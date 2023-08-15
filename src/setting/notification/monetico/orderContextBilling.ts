export class OrderContextBilling {
  private civility: string | null = null;
  private name: string | null = null;
  private firstName: string | null = null;
  private lastName: string | null = null;
  private middleName: string | null = null;
  private address: string | null = null;
  private addressLine1 = '';
  private addressLine2: string | null = null;
  private addressLine3: string | null = null;
  private city = '';
  private postalCode = '';
  private country = '';
  private stateOrProvince: string | null = null;
  private countrySubdivision: string | null = null;
  private email: string | null = null;
  private phone: string | null = null;
  private mobilePhone: string | null = null;
  private homePhone: string | null = null;
  private workPhone: string | null = null;

  constructor(
    addressLine1: string,
    city: string,
    postalCode: string,
    country: string,
  ) {
    this.setAddressLine1(addressLine1);
    this.setCity(city);
    this.setPostalCode(postalCode);
    this.setCountry(country);
  }

  jsonSerialize(): any {
    return Object.fromEntries(
      Object.entries(this).filter(([, value]) => value !== null),
    );
  }

  getCivility(): string | null {
    return this.civility;
  }

  setCivility(civility: string | null): this {
    this.civility = civility;
    return this;
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

  getMiddleName(): string | null {
    return this.middleName;
  }

  setMiddleName(middleName: string | null): this {
    this.middleName = middleName;
    return this;
  }

  getAddress(): string | null {
    return this.address;
  }

  setAddress(address: string | null): this {
    this.address = address;
    return this;
  }

  getAddressLine1(): string {
    return this.addressLine1;
  }

  setAddressLine1(addressLine1: string): this {
    this.addressLine1 = addressLine1;
    return this;
  }

  getAddressLine2(): string | null {
    return this.addressLine2;
  }

  setAddressLine2(addressLine2: string | null): this {
    this.addressLine2 = addressLine2;
    return this;
  }

  getAddressLine3(): string | null {
    return this.addressLine3;
  }

  setAddressLine3(addressLine3: string | null): this {
    this.addressLine3 = addressLine3;
    return this;
  }

  getCity(): string {
    return this.city;
  }

  setCity(city: string): this {
    this.city = city;
    return this;
  }

  getPostalCode(): string {
    return this.postalCode;
  }

  setPostalCode(postalCode: string): this {
    this.postalCode = postalCode;
    return this;
  }

  getCountry(): string {
    return this.country;
  }

  setCountry(country: string): this {
    this.country = country;
    return this;
  }

  getStateOrProvince(): string | null {
    return this.stateOrProvince;
  }

  setStateOrProvince(stateOrProvince: string | null): this {
    this.stateOrProvince = stateOrProvince;
    return this;
  }

  getCountrySubdivision(): string | null {
    return this.countrySubdivision;
  }

  setCountrySubdivision(countrySubdivision: string | null): this {
    this.countrySubdivision = countrySubdivision;
    return this;
  }

  getEmail(): string | null {
    return this.email;
  }

  setEmail(email: string | null): this {
    this.email = email;
    return this;
  }

  getPhone(): string | null {
    return this.phone;
  }

  setPhone(phone: string | null): this {
    this.phone = phone;
    return this;
  }

  getMobilePhone(): string | null {
    return this.mobilePhone;
  }

  setMobilePhone(mobilePhone: string | null): this {
    this.mobilePhone = mobilePhone;
    return this;
  }

  getHomePhone(): string | null {
    return this.homePhone;
  }

  setHomePhone(homePhone: string | null): this {
    this.homePhone = homePhone;
    return this;
  }

  getWorkPhone(): string | null {
    return this.workPhone;
  }

  setWorkPhone(workPhone: string | null): this {
    this.workPhone = workPhone;
    return this;
  }
}
