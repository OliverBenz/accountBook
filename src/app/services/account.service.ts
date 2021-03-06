import { LinkService } from './link.service';
import { Account } from '../classes/account/account';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

const httpOptions = {
  headers: new HttpHeaders({}),
};

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private accountSource = new BehaviorSubject<any>("");
  currentAccounts = this.accountSource.asObservable();

  private _url = "";
  private _filter = "";

  private _limit = 50;

  constructor(
    private http: HttpClient,
    private linkService: LinkService
  ) {
    this._url = this.linkService.getAccountLink();
    httpOptions.headers = this.linkService.getHeader();
  }

  public setFilter(filter){
    this._filter = filter;
    this.getAccounts()
  }

  // -----------------------------------------
  //           Get Accounts
  // -----------------------------------------
  public getAccounts(){
    // TODO: filter accounts in api call so we don't get 1000 accounts
    // TODO: contains value
    let urlNew = this._url + "?filters[website][like]=" + this._filter;
    // urlNew += "&offset=" + (page * this._limit);
    
    if(this._filter == ""){
      urlNew += "&limit=" + this._limit;  
    }

    this.http.get<any>(urlNew, httpOptions).subscribe(data => {
      var accountList: Array<Account> = [];
      
      for(let i = 0; i < data.data.length; i++){
        var account: Account = new Account(data.data[i].id, data.data[i].website, data.data[i].username, data.data[i].password, data.data[i].date, data.data[i].info, data.data[i].likes, data.data[i].dislikes);
        accountList.push(account);
      }

      // --------- Calculate Rating ---------
      accountList = this.calcRating(accountList);

      // --------- Sort Accounts ---------
      accountList = this.sortAccounts(accountList);

      // --------- Push Accounts ---------
      this.accountSource.next(accountList);
    });
  }

  // -----------------------------------------
  //           Send Accounts
  // -----------------------------------------
  public sendAccounts(account){
    let body = JSON.parse('{"ID": 0, "website": "' + account.getWebsite() + '", "username":"' + account.getUsername() + '", "date": "' + account.getDate() + '", "password": "' + account.getPassword() + '", "info": "' + account.getInfo() + '", "likes": 0, "dislikes": 0}');
       // {
    //   "ID": account.getId(),
    //   "website": account.getWebsite(),
    //   "date": account.getDate(),
    //   "user": account.getUsername(),
    //   "password": account.getPassword(),
    //   "info": account.getInfo(),
    //   "likes": account.getLikes(),
    //   "dislikes": account.getDislikes()
    // }

    // TODO: Error handling
    this.http.post(this._url, body, httpOptions).subscribe((data: any) => {});
  }

  // -----------------------------------------
  //           Update Accounts
  // -----------------------------------------
  public updateAccounts(acc: Account){
    let body = JSON.parse('{"ID": ' + acc.getId() + ', "website": "' + acc.getWebsite() + '", "username":"' + acc.getUsername() + '", "date": "' + acc.getDate() + '", "password": "' + acc.getPassword() + '", "info": "' + acc.getInfo() + '", "likes": ' + acc.getLikes() + ', "dislikes": ' + acc.getDislikes() + '}');
    
    this.http.put(this._url + "/" + acc.getId(), body, httpOptions).subscribe(data => {
      console.log(data);
    }, error =>{
      console.log(error);
    })
  }

  // -----------------------------------------
  //           Calculate Rating
  // -----------------------------------------
  calcRating(Accounts: Array<Account>){
    for (let i in Accounts){
      if(Accounts[i].getLikes() == 0 && Accounts[i].getDislikes() == 0){
        Accounts[i].setRating(0);
      }
      else{
        var rate = ( 100 / (Accounts[i].getLikes() + Accounts[i].getDislikes())) * Accounts[i].getLikes();
        Accounts[i].setRating(Math.round(rate)); 
      }
    }

    return Accounts;
  }

  // -----------------------------------------
  //           Sort Accounts
  // -----------------------------------------
  sortAccounts(Accounts){
    var newID = 0;
    for(let i = 0; i < Accounts.length; i++){
      var BigAr = Accounts[i];

      for(let a = 0 + newID; a < Accounts.length; a++){
        if(BigAr.getRating() < Accounts[a].getRating()){
          BigAr = Accounts[a];
        }
      }
      // Get the old ArrayID
      var oldID = 0
      for(let b = 0; b < Accounts.length; b++){
        if(Accounts[b] == BigAr){
          oldID = b;
        }
      }
      // Remove from old Index and add to new index
      Accounts.splice(oldID, 1);
      Accounts.splice(newID, 0, BigAr);
      newID++;
    }

    return Accounts;
  }
}