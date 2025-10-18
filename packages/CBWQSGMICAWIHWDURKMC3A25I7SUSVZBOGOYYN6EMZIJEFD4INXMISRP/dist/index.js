import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CBWQSGMICAWIHWDURKMC3A25I7SUSVZBOGOYYN6EMZIJEFD4INXMISRP",
    }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAQAAAAAAAAAAAAAACVRva2VuSW5mbwAAAAAAAAMAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAZzeW1ib2wAAAAAABAAAAAAAAAADHRvdGFsX3N1cHBseQAAAAs=",
            "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAGc3ltYm9sAAAAAAAQAAAAAAAAAAx0b3RhbF9zdXBwbHkAAAALAAAAAA==",
            "AAAAAAAAAAAAAAAIZ2V0X25hbWUAAAAAAAAAAQAAABA=",
            "AAAAAAAAAAAAAAAKZ2V0X3N5bWJvbAAAAAAAAAAAAAEAAAAQ",
            "AAAAAAAAAAAAAAAQZ2V0X3RvdGFsX3N1cHBseQAAAAAAAAABAAAACw==",
            "AAAAAAAAAAAAAAALZ2V0X2JhbGFuY2UAAAAAAAAAAAEAAAAL",
            "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA="]), options);
        this.options = options;
    }
    fromJSON = {
        initialize: (this.txFromJSON),
        get_name: (this.txFromJSON),
        get_symbol: (this.txFromJSON),
        get_total_supply: (this.txFromJSON),
        get_balance: (this.txFromJSON),
        transfer: (this.txFromJSON)
    };
}
