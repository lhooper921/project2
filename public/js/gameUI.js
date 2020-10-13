$(document).ready(async function () {

    class Player {
        constructor(name, chips, hand, weight) {
            this.name = name;
            this.chips = chips;
            this.hand = hand;
            this.weight = weight;
        }
    }

    const DECK_ID = await getDeckID();
    var user = await getUserData();

    var dealer = new Player("DEALER", 0, [],);
    var player = new Player(user.name, user.chips , [],);

    var bet = 0;
    var handDone = false;
    var dealerHandValue = 0;
    var playerHandValue = 0;

    var gamePlate = $("#game-plate");
    var welcomePlate = $("#welcome-plate");


    document.addEventListener('click', async function (event) {
        event.preventDefault();

        let status;

        switch (event.target.id) {
            case 'bet-btn':
                bet = $("#bet-amount").val();
                renderHands();
                break;

            case 'stay-btn':
                //checks for dealer bust
                if(!handDone) {
                    $(".dealer-hand").append((createCardIMG(dealer.hand[1].image)));
                    status = await dealerHit();
                }

                resolveHand(status);
                break;

            case 'hit-btn':
                //Checks for player bust
                if(!handDone) status = await hit();

                resolveHand(status);
                break;

            case 'play-again':
                dealer.hand = [];
                player.hand = [];
                dealerHandValue = 0;
                playerHandValue = 0;
                bet = 0;
                handDone = false;

                updateUser({chips: player.chips, id: user.id});

                $(".card-display").remove();
                $(".report-display").remove();
                $("#show-chips").text(`You currently have ${player.chips} chips`);

                welcomePlate.show();
                break;

            default:
                break;
        }
        
    });

    async function resolveHand(status){

        console.log(status);

        switch (status){
            case 'PLAYER SAFE':
                break;
            case 'PLAYER BUST':
                $(".dealer-hand").append((createCardIMG(dealer.hand[1].image)));
                playerHandValue = Math.min(...(getHandValues(player.hand)));
                dealerHandValue = Math.max(...(getHandValues(dealer.hand)));
                renderReport("lose");
                break;
            case 'DEALER BUST':
                playerHandValue = Math.max(...(getHandValues(player.hand)));
                dealerHandValue = Math.min(...(getHandValues(dealer.hand)));
                renderReport("win!!");
                break;
            case 'DEALER STAY':
                playerHandValue = Math.max(...(getHandValues(player.hand).filter((val) => {return val <= 21})));
                dealerHandValue = Math.max(...(getHandValues(dealer.hand).filter((val) => {return val >= 17 && val <= 21;})));
                if(dealerHandValue == playerHandValue){
                    renderReport("push...");
                } else {
                    dealerHandValue > playerHandValue ? renderReport("lose") : renderReport("win!!");
                }
                break;
        }
        console.log(dealer);
        console.log(player);
    }

    function renderReport(result) {

        $(".player-action").hide();

        if(!handDone){

            if(result == "win!!") player.chips += parseInt(bet);
            if(result == "lose") player.chips -= parseInt(bet);
    
            var reportCol = $(".report-display");
    
            var handReport = $("<div></div>").addClass("bg-light rounded m-1 p-3");
            var winStatus = $("<h2></h2>").addClass("m-3 text-center").text(`You ${result}`);
            var betView = $("<h2></h2>").addClass("m-3").text(`Bet amount: ${bet}`);
            var playerValue = $("<h2></h2>").addClass("m-3").text(`Your hand: ${playerHandValue}`);
            var dealerValue = $("<h2></h2>").addClass("m-3").text(`Dealer's hand: ${dealerHandValue}`);
            var chipCount = $("<h3></h3>").addClass("m-3").text(`You now have ${player.chips} chips`);
            var playAgain = $("<h3></h3>").addClass("m-3").text("Would you like to play again?");
            var playAgainbtn = $("<button></button>").addClass("btn btn-primary btn-block p-3").text("Play Again").attr("id", "play-again");
    
            handReport.append(winStatus);
            handReport.append(betView);
            handReport.append(playerValue);
            handReport.append(dealerValue);
            handReport.append(chipCount);
            handReport.append(playAgain);
            handReport.append(playAgainbtn);
            reportCol.append(handReport);
    
            handDone = true;
        }
    }

    async function dealerHit(){

        let handValues = getHandValues(dealer.hand);

        //if none of the possible hand values for the dealer are less than 21, then the dealer busts
        if(Math.min(...handValues) > 21) {
            return "DEALER BUST";
        }

        //If the dealer didnt bust, create an array of values that meets the dealer stay condition
        let stayAmounts = handValues.filter((value) => {return value >= 17 && value <= 21});

        console.log(...stayAmounts);

        //Return the maximum value out of the amounts that meet stay conditions
        if(stayAmounts.length > 0){
            return "DEALER STAY";
        }

        //If the dealer didnt bust and none of the possible handvalues fufilled the stay condition, then the dealer hits
        var card = await draw(1);
        dealer.hand.push(card[0]);

        //Render new card
        $(".dealer-hand").append(createCardIMG(dealer.hand[dealer.hand.length - 1].image));

        return dealerHit();
    }
    
    async function hit(){

        var card = await draw(1);
        player.hand.push(card[0]);

        $(".player-hand").append(createCardIMG(player.hand[player.hand.length - 1].image));

        let handValues = getHandValues(player.hand);
        console.log(handValues);
        
        let safeAmounts = handValues.filter((value) => {return value <= 21});

        let status = safeAmounts.length == 0 ? "PLAYER BUST" : "PLAYER SAFE";
        playerHandValue = Math.max(...safeAmounts);

        return status;
    }

    //Returns all possible hand values (NOTE: An ace can be equal to 11 or 1)
    function getHandValues(hand){

        let aceCount = 0;
        let maxHandTotal = hand.reduce((total, card) => {

            let val = parseInt(card.value);
            let pVal = !isNaN(val) ? val :
                card.value === "ACE" ? 11 : 10;

            if(pVal == 11) aceCount++;

            return total + pVal;
        }, 0);

        let handValues = [maxHandTotal];

        while(aceCount > 0){
            handValues.push(maxHandTotal - aceCount * 10);
            aceCount--;
        }

        return handValues;
    }

    async function renderHands() {

        welcomePlate.hide();

        dealer.hand = await draw(2);
        player.hand = await draw(2);

        //Contains dealer and player cards
        var mainCol = $("<div></div>").addClass("col-md-8 card-display");
        var reportCol = $("<div></div>").addClass("col-md-4 report-display p-3");

        var handReport = $("<div></div>").addClass("bg-light rounded m-1 p-3 player-action");
        var stayBtn = $("<div></div>").addClass("btn btn-primary btn-large btn-block  p-3 stay-btn").text("Stay").attr('id', "stay-btn");
        var hitBtn = $("<div></div>").addClass("btn btn-warning btrn-large btn-block  p-3 hit-btn").text("Hit").attr('id', "hit-btn");

        handReport.append(stayBtn);
        handReport.append(hitBtn);
        reportCol.append(handReport);

        var dealerRow = $("<div></div>").addClass("row dealer-hand p-1");
        var dealerHeader = $("<h3></h3>").text("Dealer").addClass("text-white");
        //dealerRow.append((createCardIMG(dealer.hand[0].image)).hide());
        dealerRow.append(createCardIMG(dealer.hand[0].image));
        mainCol.append(dealerHeader);
        mainCol.append(dealerRow);

        var playerRow = $("<div></div>").addClass("row player-hand p-1");
        var playerHeader = $("<h3></h3>").text("Player").addClass("text-white");
        playerRow.append(createCardIMG(player.hand[0].image));
        playerRow.append(createCardIMG(player.hand[1].image));
        mainCol.append(playerHeader);
        mainCol.append(playerRow);

        gamePlate.append(mainCol);
        gamePlate.append(reportCol);
    }

    function createCardIMG(src) {

        let img = $("<img>").attr('src', src).addClass("m-1");
        return img;
    }

    async function getDeckID() {

        let res = await $.ajax({
            url: "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6",
            method: "GET"
        });
        return res.deck_id;
    }

    async function draw(amount) {

        let res = await $.ajax({
            url: `https://deckofcardsapi.com/api/deck/${DECK_ID}/draw/?count=${amount}`,
            method: "GET"
        });
        return res.cards;
    }

    async function getUserData() {
        
        let res = await $.get("api/user_data");
        return res;
    }

    async function updateUser(data) {
        $.ajax({
            method: "PUT",
            url: "api/user_data",
            data: data
        });
    }
});