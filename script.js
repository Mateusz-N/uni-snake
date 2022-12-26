class Snake {
    constructor(head_posRow, head_posCol, tail_direction) { // Utwórz węża o głowie w kratce X:[posCol], Y:[posRow] i ogonie po [direction] stronie
        this.dead = false;
        this.length = 1;
        this.head = {
            posRow: head_posRow,
            posCol: head_posCol
        }
        this.body = [];
        this.tail = {};
        this.enteringPortal = false                         // Czy głowa przechodzi obecnie przez portal (jeśli za portalem jest ściana, ta zmienna zapobiegnie zderzeniu)
        this.addSegment(tail_direction);                    // Direction - kierunek świata (N - północ, S - południe, W - zachód, E - wschód)
    }
    static calculateMovement(direction) {
        let [offsetX, offsetY] = [0, 0];                    // Przesunięcie X, Y względem ostatniego segmentu
        let orientation;
        switch(direction) {
            case "N":
                offsetY = -1;
                orientation = "S";                          // Zwrot odwrotny do kierunku dodawania (czyli "od ogona do głowy")
                break;
            case "S":
                offsetY = 1;
                orientation = "N";
                break;
            case "W":
                offsetX = -1;
                orientation = "E";
                break;
            case "E":
                offsetX = 1;
                orientation = "W";
                break;
        }
        return {
            offsetX: offsetX,
            offsetY: offsetY,
            orientation: orientation,
            direction: direction
        };
    }
    addSegment(direction) {
        let movement = Snake.calculateMovement(direction);
        let [offsetX, offsetY] = [movement.offsetX, movement.offsetY];
        let orientation = movement.orientation;
        let orientationPrev;                                // Orientacja poprzedniego segmentu
        let turn = false;                                   // Czy po dodaniu tego segmentu dojdzie do skrętu ciała?
        if(this.length === 1) {                             // Jeśl istnieje sama głowa, "doczep" ogon
            this.tail.posRow = offsetY + this.head.posRow;
            this.tail.posCol = offsetX + this.head.posCol;
            this.head.orientation = orientation;            // Zwróć głowę w tym samym kierunku co ogon (jeszcze nie może dojść do skrętu, bo nie ma ciała)
        }
        else {                                              // Jeśli wąż ma więcej niż samą głowę, przesuń ogon, a w jego stare miejsce wstaw nowy segment ciała
            if(this.body.length > 0) {
                orientationPrev = this.body[this.body.length - 1].orientation;
            }
            else {
                orientationPrev = this.tail.orientation;
            }
            orientationPrev = orientationPrev.charAt(0);    // charAt(0), bo w przypadku skrętu w poprzednim segmencie, dla prawidłowego połączenia, należy wziąć pierwszy zwrot (np. SE = segment idący na południe a następnie na wschód; obecny segment musi także być zwrócony w południe)
            if(orientation !== orientationPrev) {
                turn = true;
                orientation += orientationPrev;
            }
            this.body.push({
                posRow: this.tail.posRow,
                posCol: this.tail.posCol,
                orientation: orientation,
                turn: turn
            });
            this.tail.posRow += offsetY;
            this.tail.posCol += offsetX;
        }
        this.tail.orientation = orientation.charAt(0); 
        this.length++;
    }
    move(direction) {
        /* Zasady działania ruchu:
            1) orientacja głowy ustawiana jest na kierunek ruchu
            2) ogon wchodzi na miejsce ostatniego segmentu ciała, który jest usuwany
            3) jako, że teraz jest 1 segment ciała mniej (co nie powinno mieć miejsca), należy dodać 1 segment spowrotem - tym razem zaraz za głową (prostsze rozwiązanie niż przesuwanie każdego segmentu z osobna)
            4) głowa przesuwa się o kratkę w [direction]
        */
        let movement = Snake.calculateMovement(direction);
        let [offsetX, offsetY] = [movement.offsetX, movement.offsetY];
        let prevDirection = this.head.orientation;
        this.head.orientation = direction;
        if(this.body.length > 0) {
            this.tail = structuredClone(this.body.pop());               // Klon obiektu - zwykłe przypisanie nie działa poprawnie
            this.tail.orientation = this.tail.orientation.slice(-1);    // Ogon nie może skręcać, więc wchodząc na miejsce skrętu, musi przybrać orientację wyjściową skrętu
            this.body.unshift(structuredClone(this.head));
            if(this.body[0].orientation !== prevDirection) {
                this.body[0].turn = true;
                this.body[0].orientation = prevDirection + this.body[0].orientation;
            }        
        }
        else {
            this.tail = structuredClone(this.head);
        }
        this.head.posRow += offsetY;
        this.head.posCol += offsetX;
        this.dead = this.isDead();
    }
    isDead() {
        return  !this.enteringPortal
                &&(
                    this.head.posCol > 15                                                           // Głowa poza planszą (rozmiar powinien być dynamiczny, ale... nie w tej wersji!)
                    ||
                    this.head.posRow > 15
                    ||
                    this.head.posCol < 0
                    ||
                    this.head.posRow < 0
                )
                ||
                this.head.posRow === this.tail.posRow && this.head.posCol === this.tail.posCol  // Głowa na ogonie
                ||
                this.body.filter(segment => {                                                   // Głowa na segmencie ciała
                    return this.head.posRow === segment.posRow && this.head.posCol === segment.posCol;
                }).length !== 0;
    }
}

$(document).ready(() => {
    const drawSnakeSegment = (snake, segmentName, bodySegmentNr) => {
        let segment = snake[segmentName];
        let segmentName_capitalized = segmentName.charAt(0).toUpperCase() + segmentName.slice(1);
        let imgId = segmentName_capitalized;
        if(segmentName === "body") {
            imgId += bodySegmentNr;
            segment = segment[bodySegmentNr];
            if(segment.turn) {
                segmentName = "turn";
            }
        }
        let rotation = "0"; // N lub NE/EN
        switch(segment.orientation) {
            case "S":
            case "EN":
            case "SW":
                rotation = "180";
                break;
            case "W":
            case "SE":
            case "WN":
                rotation = "-90";
                break;
            case "E":
            case "NW":
            case "ES":
                rotation = "90";
                break;
        }
        $(`#game`).append(`<img src = './resources/snake_${segmentName}.svg' class = 'snake' id = 'snake${imgId}'>`);
        $(`#snake${imgId}`).css({
            top: `${segment.posRow * 32}px`,
            left: `${segment.posCol * 32}px`,
            transform: `rotate(${rotation}deg)`
        });
    };
    
    const drawSnake = (snake) => {
        $(".snake").remove();   // Usuń starego węża, by zapobiec duplikacji po każdym przerysowaniu
        drawSnakeSegment(snake, "head", null);
        snake.body.forEach((segment, idx) => {
            drawSnakeSegment(snake, "body", idx);
        });
        drawSnakeSegment(snake, "tail", null);
    };

    const coordsTaken = (coords) => {    // Sprawdź czy w danych koordynatach już coś istnieje
        let taken = false;
        let entity;
        $("#game").children("img").each(function() {
            if(coords[0] == parseFloat($(this).css("top")) / 32 && coords[1] == parseFloat($(this).css("left")) / 32) {
                taken = true;
                entity = $(this);
            }
        });
        return {taken: taken, by: entity};
    };

    const drawEntities = () => {    // Wygeneruj obiekty na planszy (jedzenie, przeszkody)
        let entityCoords = [];
        let entityPosRow;
        let entityPosCol;
        let entityType = "food";
        let entityName = "apple";
        let entity_currentType_id = 1;  // Nr obiektu o danej nazwie (nie obiektu w ogóle!)
        for(let entityNr = 1; entityNr <= 34; entityNr++) {     // 16 potraw - 8 jabłek i 8 ananasów, 16 przeszkód i 1 para teleportów (we/wy)
            switch(entityNr) {
                case 9:                                         // Po 8 jabłkach zacznij liczenie ID od nowa i zmień typ na ananas - w ten sposób wystarczy jedna pętla
                    entity_currentType_id = 1;
                    entityName = "pineapple";
                    break;
                case 17:
                    entity_currentType_id = 1;
                    entityType = "obstacle";
                    entityName = "spikes";
                    break;
                case 33:
                    entity_currentType_id = 1;
                    entityType = "portal";
                    entityName = "portalIn";
                    break;
                case 34:
                    entity_currentType_id = 1;
                    entityType = "portal";
                    entityName = "portalOut";
                    break;
            }
            do {    // Losuj pozycję dopóki nowe koordynaty nie są unikalne na planszy
                entityPosRow = Math.floor(Math.random() * 16);
                entityPosCol = Math.floor(Math.random() * 16);
            }
            while(coordsTaken([entityPosRow, entityPosCol]).taken);
            entityCoords.push({posRow: entityPosRow, posCol: entityPosCol, id: entity_currentType_id});  // Dodaj koordynaty nowego obiektu do tablicy z koordynatami
            $(`#game`).append(`<img src = './resources/${entityName}.svg' class = '${entityType} ${entityName}' id = '${entityName}${entity_currentType_id}' alt = '${entityName}'>`);
            $(`#${entityName}${entity_currentType_id}`).css({
                top: `${entityPosRow * 32}px`,
                left: `${entityPosCol * 32}px`
            });
            entity_currentType_id++;
        }
    };

    const turn = (turnDirection) => {
        if(!turnCooldown) {
            let turnLeft;
            if(turnDirection === "left") {
                turnLeft = true;
            }
            else if(turnDirection === "right") {
                turnLeft = false;
            }
            if(typeof turnLeft !== "undefined") {   // Jeśli jakimś przypadkiem nie jest to dokładnie "left" ani "right"
                switch(moveDirection) {
                    case "N":
                        moveDirection = turnLeft ? "W" : "E"
                        break;
                    case "E":
                        moveDirection = turnLeft ? "N" : "S"
                        break;
                    case "S":
                        moveDirection = turnLeft ? "E" : "W"
                        break;
                    case "W":
                        moveDirection = turnLeft ? "S" : "N"
                        break;
                }
            }
            turnCooldown = true;
        }
    };

    const showOverlay = (overlayClass, overlayHTML) => {
        if($("#gameOverlay").hasClass("hidden")) {          // Jeśli żadna nakładka nie jest obecnie aktywna
            gamePaused = true;
            $("#gameOverlay").toggleClass(`${overlayClass} hidden`);
            $("#gameOverlay").html(overlayHTML);
            $("#gameOverlay").fadeIn();
        }
    };

    const hideOverlay = (overlayClass) => {
        if($("#gameOverlay").hasClass(overlayClass)) {
            $("#gameOverlay").toggleClass(overlayClass);    // Usuń klasę [overlayClass] od razu, by nie dopuścić do ponownego wykonania tego bloku dopóki trwa animacja
            $("#gameOverlay").fadeOut("normal", function() {
                $("#gameOverlay").toggleClass("hidden");    // Dodaj klasę "hidden" dopiero po animacji, by nie dopuścić do jej przerwania inną akcją (co zepsułoby animację)
                gamePaused = false;
            });
        }
    };

    const addScoreToRanking = (player, score) => {                  // Dodanie wyniku gracza do tabeli top 10 wyników
        let playerScores = [];
        oldPB_player = localStorage.getItem("pbPlayer");            // Rekord osobisty gracza jest zapisywany na stałe (i wyświetlany w tabeli, jeśli mieście się w top 10)
        oldPB_score = localStorage.getItem("pbScore");              // Każdy kolejny wynik nie jest zapisywany, jeśli nie jest nowym rekordem osobistym, ale jest wyświetlany po zakończeniu gry w celu porównania
        if(oldPB_score === null || oldPB_score !== null && parseInt(oldPB_score) < score) { // Ustaw nowy rekord osobisty, jeśli poprzedni został poprawiony, lub jest to pierwszy wynik
            localStorage.setItem("pbPlayer", player);
            localStorage.setItem("pbScore", score);
            $("#newPB").show();
        }
        if(oldPB_score !== null) {
            playerScores.push({player: oldPB_player, score: parseInt(oldPB_score), old: true});
        }
        playerScores.push({player: player, score: score, old: false});
        playerScores.forEach(result => {
            let rank = 11;
            $("#resultsTable > tbody > tr").each(function() {
                if(result.score > parseInt($(this).find("td:eq(1)").text())) {
                    rank--;
                }
            });
            if(rank !== 11) {                                       // Wstaw rekord w odpowiednie miejsce, przesuwając niższe pozycje (i usuwając ostatnią, by zachować liczbę 10 wyników)
                let row = $(`#resultsTable > tbody > tr:eq(${rank - 1})`);
                row.before(`<tr class = 'playerResult'><td>${result.player}</td><td><span class = 'playerScore'>${result.score}<span class = 'playerScoreIndicator'>\<\- ` + (result.old ? `Rekord osobisty` : `Bieżąca próba`) + `</span></span></td></tr>`);
                $(`#resultsTable > tbody > tr:last`).remove();
            }
        });
    };

    const prepareGame = (snake) => {
        drawSnake(snake);
        drawEntities();
        moveDirection = "S";        
        turnCooldown = false;
        gamePaused = true;
        score = 0;
        $("#score").text("0");
    };

    const timeout = () => {
        setTimeout(() => {                     // Interwał czasowy między kolejnymi re-renderami węża
            if(!gamePaused) {
                jim.move(moveDirection);
                if(jim.enteringPortal) {
                    jim.head.posRow = parseFloat(portalOut.css("top")) / 32;
                    jim.head.posCol = parseFloat(portalOut.css("left")) / 32;
                    jim.enteringPortal = false;
                }
                let checkCollision = coordsTaken([jim.head.posRow, jim.head.posCol]);
                let entity;
                if(checkCollision.taken) {
                    entity = checkCollision.by;
                    if(entity.hasClass("food")) {
                        jim.addSegment(Snake.calculateMovement(jim.tail.orientation).orientation);
                        entity.remove();
                        if(entity.hasClass("apple")) {
                            score += 100;
                        }
                        else if(entity.hasClass("pineapple")) {
                            score += 200;
                        }
                        $("#score").text(score);
                    }
                    else if(entity.hasClass("obstacle")) {
                        drawSnake(jim);
                        jim.dead = true;
                    }
                    else if(entity.hasClass("portalIn")) {
                        jim.enteringPortal = true;
                        portalOut = $("#" + entity.attr("id").replace("In", "Out"));
                    }
                }
                if(jim.dead) {
                    showOverlay("gameOver", gameOverMsg);
                    $("#finalScore").text(score);
                }
                else {
                    drawSnake(jim);
                    if(!jim.enteringPortal) {
                        turnCooldown = false;
                    }
                }
            }
            timeout();
        }, Math.max(512 - jim.length * 32, 32));
    };

    const startScreenMsg =
    `
        <h1>Witaj w <em>Lizard King</em>!</h1>
        <h2>Naciśnij <em>Enter</em> by rozpocząć!</h2>
    `;

    const gameOverMsg =
    `
        <h1 id = 'gameOver'>Game over!</h1>
        <h2>Wynik: <span id = 'finalScore'></span></h2>
        <h4 id = 'newPB'>Nowy rekord osobisty!!</h4>
        <form id = "resultsForm">
            <label for = 'playerName'>Wpisz imię: </label>
            <input type = 'text' name = 'playerName' placeholder = 'Jim' id = 'playerName'>
            <input type = 'button' value = 'Pokaż ranking' id = 'resultsSubmit'>
        </form>
        <table id = 'resultsTable'>
            <thead>
                <tr>
                    <th>Gracz</th>
                    <th>Wynik</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Andrzej</td>
                    <td>15000</td>
                </tr>
                <tr>
                    <td>Amanda</td>
                    <td>1200</td>
                </tr>
                <tr>
                    <td>Antoni</td>
                    <td>900</td>
                </tr>
                <tr>
                    <td>Albert</td>
                    <td>700</td>
                </tr>
                <tr>
                    <td>Alan</td>
                    <td>500</td>
                </tr>
                <tr>
                    <td>Arek</td>
                    <td>500</td>
                </tr>
                <tr>
                    <td>Alina</td>
                    <td>400</td>
                </tr>
                <tr>
                    <td>Abraham</td>
                    <td>200</td>
                </tr>
                <tr>
                    <td>Alicja</td>
                    <td>200</td>
                </tr>
                <tr>
                    <td>Ania</td>
                    <td>100</td>
                </tr>
            </tbody>
        </table>
        <h3><em>Enter</em> by zagrać ponownie</h3>
    `;

    $(document).on("keydown", function(event) {
        switch(event.key) {
            case "Escape":
                showOverlay("escape", "<h1>Czy na pewno chcesz zakończyć grę? (T/N)</h1>");
                break;
            case "Enter":
                if($("#gameOverlay").hasClass("gameOver")) {
                    $("#gameOverlay").toggleClass("gameOver start");
                    $("#gameOverlay").html(startScreenMsg);
                    jim = new Snake(8, 7, "N"); // Zresetuj węża do ustawień fabrycznych
                    prepareGame(jim);
                }
                else {
                    hideOverlay("start");
                }
                break;
            case " ":
                if(gamePaused) {    // Dodatkowe sprawdzenie; bez niego jedna funkcja przerywa drugą :(
                    hideOverlay("paused");
                }
                else {
                    showOverlay("paused", "<h1>Pauza</h1><h2><em>Spacja</em> by odpauzować</h2>");
                }
                break;
            case "ArrowLeft":
                if($("#gameOverlay").hasClass("hidden")) {
                    turn("left");
                }
                break;
            case "ArrowRight":
                if($("#gameOverlay").hasClass("hidden")) {
                    turn("right");
                }
                break;
            case "t":
                if($("#gameOverlay").hasClass("escape")) {
                    $("#gameOverlay").toggleClass("escape gameOver")
                    $("#gameOverlay").html(gameOverMsg);
                    $("#finalScore").text(score);
                }
                break;
            case "n":
                hideOverlay("escape");
                break;
        }
    });

    $("#game").on("click", "#resultsSubmit", function() {
        $("#resultsTable").show();
        $("#resultsForm").hide();
        let playerName = $("#playerName").val();
        if (playerName.length === 0) {
            playerName = $("#playerName").attr("placeholder");
        }
        addScoreToRanking(playerName, score);
    });

    /* Rysowanie planszy (wygenerowanie tabeli 16x16) */
    for(let row = 1; row <= 16; row++) {
        $("#game > tbody:last-child").append("<tr id = 'row_" + row + "'>");
        for(let col = 1; col <= 16; col++) {
            $("#row_" + row).append("<td id = 'cell_" + row + "-" + col + "'></td>");
        }
        $("#row_" + row).append("</tr>");
    }
    $("#cell_1-1").append(`<div id = "gameOverlay" class = "start">${startScreenMsg}</div>`);  // Musi być wstawiony w komórkę, bo <div> nie może być umieszczony bezpośrednio w <table>

    /* Właściwe rozpoczęcie gry */
    let moveDirection, turnCooldown, gamePaused, score, portalOut; // Zmienne globalne na bieżąco aktualizowane podczas gry
    let jim = new Snake(8, 7, "N");
    prepareGame(jim);
    timeout();
});