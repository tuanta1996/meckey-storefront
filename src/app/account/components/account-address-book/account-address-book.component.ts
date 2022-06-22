import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { gql } from "apollo-angular";
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { ModalService } from "../../../core/providers/modal/modal.service";
import { AddressModalComponent } from "../../../shared/components/address-modal/address-modal.component";

import {
    DeleteAddress,
    GetCustomerAddresses,
} from "../../../common/generated-types";
import { GET_CUSTOMER_ADDRESSES } from "../../../common/graphql/documents.graphql";
import { DataService } from "../../../core/providers/data/data.service";

@Component({
    selector: "vsf-account-address-book",
    templateUrl: "./account-address-book.component.html",
    styleUrls: ["./account-address-book.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountAddressBookComponent implements OnInit {
    addresses$: Observable<GetCustomerAddresses.Addresses[] | undefined>;
    constructor(
        private dataService: DataService,
        private modalService: ModalService,
        private translate: TranslateService
    ) {}

    ngOnInit() {
        this.addresses$ = this.dataService
            .query<GetCustomerAddresses.Query>(GET_CUSTOMER_ADDRESSES)
            .pipe(
                map(
                    (data) =>
                        data.activeCustomer && data.activeCustomer.addresses
                )
            );
    }

    createAddress() {
        this.translate
            .get("mechkey.checkout.createAddress")
            .subscribe((title) => {
                this.modalService
                    .fromComponent(AddressModalComponent, {
                        locals: {
                            title: title,
                        },
                        closable: true,
                    })
                    .pipe(
                        switchMap(() =>
                            this.dataService.query<GetCustomerAddresses.Query>(
                                GET_CUSTOMER_ADDRESSES,
                                null,
                                "network-only"
                            )
                        )
                    )
                    .subscribe();
            });
    }

    deleteAddress(addressId: any) {
        this.dataService
            .mutate<DeleteAddress.Mutation, DeleteAddress.Variables>(
                DELETE_ADDRESS,
                {
                    id: addressId,
                }
            )
            .pipe(
                switchMap(() =>
                    this.dataService.query<GetCustomerAddresses.Query>(
                        GET_CUSTOMER_ADDRESSES,
                        null,
                        "network-only"
                    )
                )
            )
            .subscribe();
    }
}

const DELETE_ADDRESS = gql`
    mutation DeleteAddress($id: ID!) {
        deleteCustomerAddress(id: $id) {
            success
        }
    }
`;
