import { getBetween, makeRandomString } from './string';

describe('StringUtil', () => {
  it('should be make random string', () => {
    // expect(service).toBeDefined();
    const a = makeRandomString(10, 'a');
    expect(a.length).toBe(10);
    const a1 = makeRandomString(10, 'aA#!');
    expect(a1.length).toBe(10);
  });
  it('should be make random string', () => {
    const start = '"entity_id":"';
    const end = '"}]],';
    const x1 = getBetween('', start, end);
    expect(x1).toBe('');
    const x2 = getBetween(
      '{"imp_id":"028yKKRi4RQAG63BB","ef_page":null,"uri":"https://www.facebook.com/nguyenanhduc0505","entity_id":"100009362329580"}]],["UITinyViewportAction","init",[],[]],["ResetScrollOnUnload","init",["__elem_a588f507_0_0_S+"],[{"__m":"__elem_a588f507_0_0_S+"}]],["AccessibilityWebVirtualCursorClickLogger","init",["__elem_45e94dd8_0_0_A+","__elem_a588f507_0_0_S+"],[[{"__m":"__elem_45e94dd8_0_0_A+"},{"__m":"__elem_a588f507_0_0_S+"}]]],["KeyboardActivityLogger","init",[],[]],["FocusRing","init",[],[]],["ErrorMessageConsole","listenForUncaughtErrors",[],[]],["HardwareCSS","init",[],[]],["AsyncRequestNectarLogging"],["IntlUtils"],["TimezoneAutoset","setInputValue",["__elem_f46f4946_0_0_TX"],[{"__m":"__elem_f46f4946_0_0_TX"},1660015420]],["ScreenDimensionsAutoSet","setInputValue",["__elem_f46f4946_0_1_wN"],[{"__m":"__elem_f46f4946_0_1_wN"}]],["LoginFormController","init",["__elem_835c633a_0_0_Rn","__elem_1edd4980_0_0_Lh"],[{"__m":"__elem_835c633a_0_0_Rn"},{"__m":"__elem_1edd4980_0_0_Lh"},null,true,{"pubKey":{"publicKey":"b5b7ce5ed1eb52b509788d15a1b8d74b0f1bdcf5c453921e6c9769f75a245522","keyId":43}}]],["BrowserPrefillLogging","initContactpointFieldLogging",[],[{"contactpointFieldID":"email","serverPrefill":""}]]',
      start,
      end,
    );
    expect(x2).toBe('100009362329580');

    const x3 = getBetween(
      '100009362329580"}]],["UITinyViewportAction","init",[],[]],["ResetScrollOnUnload","init",["__elem_a588f507_0_0_S+"],[{"__m":"__elem_a588f507_0_0_S+"}]],',
      start,
      end,
    );
    expect(x3).toBe('100009362329580');
  });
});
