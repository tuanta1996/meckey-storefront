import { Component, OnInit } from "@angular/core";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import { Observable } from "rxjs";
import { filter, map } from "rxjs/operators";
import { StateService } from "./core/providers/state/state.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "sf-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
    cartDrawerVisible$: Observable<boolean>;
    mobileNavVisible$: Observable<boolean>;
    isHomePage$: Observable<boolean>;
    languageName: {};

    constructor(
        private router: Router,
        private stateService: StateService,
        public translate: TranslateService
    ) {
        this.languageName = { vi: "Tiếng Việt", en: "English" };
        translate.addLangs(["vi", "en"]);
        translate.setDefaultLang("vi");
        translate.use(localStorage.getItem("language") || "vi");
    }

    ngOnInit(): void {
        this.cartDrawerVisible$ = this.stateService.select(
            (state) => state.cartDrawerOpen
        );
        this.mobileNavVisible$ = this.stateService.select(
            (state) => state.mobileNavMenuIsOpen
        );
        this.isHomePage$ = this.router.events.pipe(
            filter<any>((event) => event instanceof RouterEvent),
            map((event: RouterEvent) => event.url === "/")
        );
    }

    openCartDrawer() {
        this.stateService.setState("cartDrawerOpen", true);
    }

    closeCartDrawer() {
        this.stateService.setState("cartDrawerOpen", false);
    }

    switchLang(lang: string) {
        this.translate.use(lang);
        localStorage.setItem("language", lang);
        window.location.reload();
    }
}
