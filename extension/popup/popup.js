import {
  NER_MODEL,
  OperationAnnulee,
  bridgeNameParts,
  chunkText,
  detectNER,
  detectPhonesIntl,
  detectRegex,
  entityKey,
  estAnnulation,
  estComposantNonIdentifiant,
  filterByRules,
  forcedMasks,
  maskText,
  mergeEntities,
  reinject,
  selectActive,
  snapToWordBoundaries,
  verifierAnnulation
} from "./chunk-5TJ2JTOZ.js";
import {
  createBatchedPipeline
} from "./chunk-IT5BP6N7.js";
import {
  COMPRESSION_MODEL,
  compresser,
  compresserSegments
} from "./chunk-VTU65RIR.js";
import "./chunk-PIRHQTI4.js";

// src/engine/lexique.js
var LEXIQUE_COURANT = new Set(`aan aandacht aangeduid aangelegd aangrenzende aanleiding aantal aanval aanvankelijk aanwezig aarde aasta aastal aastani aastast aastat aastatel abad abaixo abajo abandon abandonado abandonar abandoned abandonn\xE9 abandon\xF3 abans abaoe abarca abate abban abbandonato abbastanza abbaye abbazia abbia abbitanti abb\xE9 abdomen aber aberto abertura abgelehnt abgel\xF6st abgerissen abgerufen abgeschlossen abh\xE4ngig abierta abierto abil abilities ability abilit\xE0 abitant abitanti abitants abitato abit\xE0ncc able aboard abogado abolished abord about above abre abril abrir abrite abri\xF3 abroad absence absent abside absolue absolut absoluta absolutam absolute absoluto absolvierte absolvoval absorbed abstract abu abundant abuse aby acaba acabar acabou acab\xF3 academia academic academy acad\xE9mico acara accanto accede acceder accent accept acceptance accepte accepted acceso access accessed accessible accesso accident accidentally accidente accidents acciones acci\xF3 acci\xF3n acclaim acclaimed accommodate accommodation accompagn\xE9 accompanied accompanying accomplished accord accordance according accordo account accounting accounts accredited accueil accueille accueillir accuracy accurate accusa accusations accuse accused acc\xE8s acc\xE9der acc\xE9s acea aceasta aceast\u0103 aceea aceea\u0219i aceite acela\u0219i acentesi aceptar acept\xF3 acerca acesso acest acesta aceste acestea acestei acestui acestuia ach achieve achieved achievement achievements achieving acht achter acid acide acidente acido acids acima aciu acknowledged ackumulerade acompa\xF1ado aconseguir aconteceu acontecimientos acord acordo acoustic acqua acque acquire acquired acquis acquisition acquistato acre acres across act acte acted actes acteur acteurs actief actif acting action actions actitud activa activated activation active actively actives actividad actividade actividades activist activists activitat activitats activiteiten activities activity activit\xE9 activit\xE9s activo activos acto actor actores actors actos actress actrice actriu actriz acts actuaciones actuaci\xF3n actual actuales actualidad actualitat actually actualment actualmente actuar actuel actuelle actuellement actu\xF3 act\xFAa acu acuerdo acueye acum acusado acute ada adalah adalwyd adam adanya adaptaci\xF3n adaptation adapted adapt\xE9 adar adat add added addig adding addirittura addition additional additions address addressed adds adel adelante ademais adem\xE1s adet adicional adicionales adina adinaren adjacent adjoint adl\u0131 administered administracinio administraci\xF3 administraci\xF3n administracji administracyjnie administrador administratif administration administrativ administrativa administrative administrativement administrativo administrator administrazio administra\xE7\xE3o admiral admis admission admitted adnabyddir ado adolah adolecanti adolescente adolescentes adopt adoptar adopted adoption adopt\xE9 adott adquirir adquiri\xF3 adran adres adresse adta adtong adt\xE1k adult adulta adulte adultes adulto adultos adults adunay advance advanced advances advantage adventure adversaire advertising advice advised advisor advocate advocated advokat ad\u0131 ad\u0131na ad\u0131nda ad\u0131n\u0131 ad\u0131n\u0131n ad\u0131yla aelodau aerea aerei aereo aerial aeronave aeronaves aeroporto aeropuerto aerop\xF2rt afdeling afecta afeliany affair affaire affaires affairs affari affect affected afferma affiche affiliate affiliated affinis affirme affluent affreschi affrontare afin afirma afirmando afirmar afirmou afirm\xF3 afkomstig afl aflat aflevering afleveringen afluent afluente afl\u0103 africana africano afro afroamericanos afromoths afstand after aftermath afternoon afterwards aftur aga again against agak agama agar age aged agence agencies agency agenda agent agente agentes agenti agents ageri agertzen ages aggiunta agglom\xE9ration aggregate aggressive agir agit agiurn\xE0t agli agn agnitus ago agora agored agost agosto agostu agree agreed agreement agreements agrees agresif agricole agricoles agricultura agricultural agriculture agrupaci\xF3n agr\xEDcola agr\xEDcolas agr\xEDcoles agua aguas agus ahead ahli ahogy ahol aholi ahora ah\xED aia aici aid aide aider aiemmin aige aigua aig\xFCes aika aikaa aikaan aikana ail aile ailes ailleurs aim aime aimed aims aina ainakin ainda ainm ainoa ainoastaan ainsi ainult air aircraft aire aired airing airline airport airs ait aiutare aiuto aix\xED aix\xF2 aja ajal ajan ajaran ajo ajoute ajuda ajudar ajuns ajutorul aka akademik akaiky akan akar akcji akhir akhirnya aki akibat akik akinek akit akkor akkori ako aksara aksi akt akteur aktiboak aktiboetatik aktif aktiv aktive aktiven aktivite aktivnosti aktor aktorka aktris aktrise aktuell aktuelle aktuellen akt\xEDv aku ak\xE1r ak\xE8h ala alabak alabarik alakult alak\xFA alam alan alan\u0131 alapj\xE1n alapul alap\xEDtott alarak alas alasan alat alates alatt alb alba albedo alberga alberi albero albo album albuma albumet albumi albumin albums albumu alb\xE9do alb\xFCm alb\xFCm\xFC alcalde alcance alcanza alcanzar alcanz\xF3 alcan\xE7ou alcohol alcool alcuerdu alcun alcuna alcune alcuni aldaar alde aldea alder aldiz aldri aldrig ald\u0131 ald\u0131\u011F\u0131 ale alebo alemana alemanes alemany alem\xE1n alem\xE3 alem\xE3o alene ales aleshores alfa alfabet alfabetizasyon alfabeto algas algebra algemeen algemene algo algorithm algoritmen algoritmo alguien algum alguma algumas algun alguna algunas algunes algunhas algunos alguns alguses alg\xFAn alg\xFAns ali alia aliados alianza alian\xE7a alias alien align alih alikuwa alimentaci\xF3n alimentar alimentation alimento alimentos aliran alive alkaa alkaen alkalommal alkohol alkoi alkoivat all alla allan allant alle alleen allegations alleged allegedly allein allem allemand allemande allemandes allemands allen allenatore aller allerdings allerede allerlei alles allgemein allgemeine allgemeinen alliance allied allies alli\xE9s allo allocated allora allow allowed allowing allows allra allt alltid all\xE1 all\xED alma almaktad\u0131r almeno almost alm\u0131\u015F alm\u0131\u015Fd\u0131r alm\u0131\u015Ft\u0131r aloitti alokairuan alone along alongside alors alpha alphabet alpina alpine already alrededor alredor als also als\xF3 alt alta altamente altar altare altaria altas alte alten alter altered alternate alternatif alternativ alternativa alternative alternatives alternativo altes altezza although altijd altitud altitude altitudine alto altor altos altra altre altres altri altro alts\xE5 altura alt\xE8sa alt\u0103 alt\u0131 alt\u0131na alt\u0131nda alue alueella alueelle alueen aluksi aluminium alumni alumnos alun alunos alus alussa alusta always al\xE1 al\xE1bbi al\xE7ada al\xE9m al\u0103turi al\u0131nm\u0131\u015F al\u0131r ama amach amac\u0131yla amante amar amarga amarillo amat amateur amateurs amb ambany ambao ambas ambassade ambassadeur ambassador ambayo ambient ambiental ambiente ambientes ambienti ambito ambos amely amelyben amelyek amelyet amelynek amenaza amended amenities american americana americane americani americano americanos americk\xE1 americk\xE9 americk\xE9ho americk\xFD americk\xFDch americ\xE0 amerikai amerikanische amerikanischen amerikanischer amerikansk amerikanska amerikanske amerindios ameri\u010Dki ameri\u010Dkoj ameri\u0161ki ameryka\u0144ska ameryka\u0144ski ameryka\u0144skiego ameryka\u0144skiej amh\xE1in ami amic amica amici amicizia amico amie amiga amigo amigos amihanan amihanang amihang amikor amin amino amiral amis amistad amit amiti\xE9 aml amministrativa amministrazione ammunition amo among amongst amor amore amount amounts amour amoureux ampia ampio ampla ample amplia ampliamente ampliar amplio ampy am\xE1s am\xE9liorer am\xE9nagement am\xE9ricain am\xE9ricaine am\xE9ricaines am\xE9ricains ana anaa anadan anak anaknya anal analisi analiza analog analyse analyses analysis anar anatin anca ancak ancestral ancestry anch anche ancho anchor ancien ancienne anciennement anciennes anciens ancient ancora and anda andare andata anden ander andere anderem anderen anderer andererseits anderes anders andet andis andra andre andro and\xF2 ane anerkannt anezha\xF1 anezho anfangs ang angeblich angeboten angebracht angegeben angelegt angenommen angeordnet anger anges angeschlossen angesehen anggota angin angka angkatan angl anglais anglaise angle angles anglicky anglick\xFD anglo angl\xE8s angl\xE9s angol angolo angolul angon angreb angrep angua\xF1o angular ang\u013Cu anh anhand anhianhi ani anii anilor anima animaci\xF3n animais animal animale animales animali animalia animals animated animation animaux anime anisan aniversario anjara anjing ankamaroan anlam\u0131na anledning anl\xE4sslich anl\xE8 ann anna annak annan annars annat annen annere annet anni annis anniversaire anniversary anno annonce annonc\xE9 annos announced announcement annual annually annuelle annuellement annum annunciato ann\xE9e ann\xE9es ano anomalia anomena anomenada anomenat anos another anot\xF3 anque ans ansatte anschlie\xDFend anschlie\xDFenden anses ansiosta anspr\xE5k ansvar answer ant antaa antal antalet antall antar antara antaranya ante antena antenne anterior anteriore anteriores anteriormente anteriors antes anthology anti antic antica antiche antichi antico antics antiga antigas antigo antigos antigua antiguas antiguo antiguos antiguu antik antiken antique antoi anu anual anualmente anul anului anuncia anunciado anunciar anunciou anunci\xF3 anv anvendes anvet anv\xE4nda anv\xE4ndas anv\xE4nder anv\xE4ndes anv\xE4nds any anyo anyone anys anything an\xE1lise an\xE1lisis an\xF4malia aon aos ao\xFBt apa apabila apaindegia apaindegiak apan apare aparece aparecen aparecer apareceu apareci\xF3 apareix aparente aparentemente aparici\xF3n apariencia apart apartaments apartamentuak aparte apartenen\u021Ba apartheid apartment apartments apar\xE8ixer apenas aperta aperto apertura apesar aphia api apie apirilaren apja aplica aplicaciones aplicaci\xF3n aplicada aplicar aplikasi apm\u0113ram apo apod apoi apoio apoyo app apparaissent appara\xEEt appare appareil appareils apparent apparently apparition appartenait appartenant appartenente appartenenti appartiene appartient appeal appear appearance appearances appeared appearing appears appel appellantur appellation appelle appel\xE9 appel\xE9e appel\xE9s appena applicable application applications applicazione applied apply appointed appointment apprend apprentissage approach approached approaches approche appropriate approval approved approximately appui appunto apre aprel aprender apresenta apresentado apresentar apresenta\xE7\xE3o apresentou april aprila aprile aprilie aprill aprillil aproape aprobaci\xF3n aproximadament aproximadamente aproximativ apr\xE8s apr\xEDl apr\xEDla apr\u012Bl\u012B apskrities apud apylink\u0117 apylink\u0117s ap\xF3s ap\u0103 ap\u0103rut aquatic aquel aquela aqueles aquell aquella aquellos aquells aquest aquesta aquestes aquests aqui aquo aqu\xED ara arab arabe arabera araberako arabes arabisk arabiska arabo aragon\xE9s arah araign\xE9es araka arall aras aras\u0131 aras\u0131nda aras\u0131ndaki araw arba arbeid arbeider arbeidet arbeiten arbeitet arbeitete arbejde arbejder arbennig arbetade arbete arbre arbres arc arcade arch archaeological archev\xEAque archi archipel architect architecte architects architectural architecture architekt architektury architetto architettura archive archives archivos arch\xE9ologique arcidiocesi arcivescovo arco arcos arcs arcybiskup ardal ard\u0131ndan are area areal arean areas aree aren arena aresztowany argent argentina argentino argento argitaratu argue argued argues arguing argument argumento arguments arhitekt ari aria ark arkitekt arm arma armada armadas armamento armas armata armate arme armed armeijan armes armi armies armii armija armor arms army arm\xE1da arm\xE1dy arm\xE9 arm\xE9e arm\xE9es arno arose around arquitecto arquitectura arra arranged arrangement arrangements arrangert array arren arrest arrested arresto arriba arribada arribar arriva arrival arrivando arrivare arrive arrived arrives arriving arrivo arriv\xE9e arriv\xF2 arri\xE8re arrondissement arrondissementet arroz arr\xEAt arr\xEAter arr\xEAt\xE9 arr\xF3l art arte artean arteko arten artene arter arteria artes arti article articles articoli articolo artifacts artificial artiglieria artigo artigos artikel artikkelen artillerie artillery artiller\xEDa artis artist artista artistas artiste artister artistes artisti artistic artistica artistico artistique artists arts artwork artylerii art\xEDculo art\xEDculos art\xEDculu art\xEDstica art\xEDstico art\u0131q arv ary ar\u012B asa asal asam asas ascenso ascens\xE3o asegurar asemenea asesinado asesinato asfalt ash ashtu asi aside asina asing asistans asistencia asistente asiter\xF4ida asi\xE1ticos ask asked askeri asking asko asks asl asli asociaci\xF3n asociado asook asosan asosiy asp aspect aspecte aspecto aspectos aspects aspetti aspetto aspx asr ass assai assalto assassinat assassination assassinato assault assedio assegnato assegurar assembled assembly assembl\xE9e assenza assessment assets assez assieme assigned assignment assim assist assistance assistant assiste assisted assistent assistente assists associate associated association associations associazione associ\xE9 assolir assoluta assoluto assume assumed assumir assumiu assunse assunto assure assurer asta asteroid asteroida asteroide asteroides asteroidibus asteroidum asteroizi aster\xF3ide astfel asti astronom astronomi astronomicarum astronomo astron\xF3m asturianu ast\xE9roid ast\xE9ro\xEFde ast\xE9ro\xEFdes ast\u0103zi asub asui asukasta asumi\xF3 asuntos asupra asus asya aszteroida as\xED ata atac atacar ataku atao ataque ataques atas atau ataupun atawa atd atelier ateliers atenci\xF3n aten\xE7\xE3o athlete athletes athletic athletics athl\xE8te ati atividade atividades atlas atleta atletas atmosfera atmosphere ato atom atoma atomic atopa atopar ator atque atrad\u0101s atrav\xE9s atriz atrodas atr\xE1s att attaccante attacchi attacco attached attach\xE9 attack attacked attacking attacks attaquant attaque attaques atteindre atteint attempt attempted attempting attempts attend attendance attended attending attendre attention attenzione attesa atti attitude attiva attivit\xE0 attivo atto attore attori attorney attorno attract attracted attraction attractions attractive attraverso attributed attributus attribu\xE9 attrice attuale attualmente atua atual atualmente atua\xE7\xE3o atunci atuou aturades atween at\xE1 at\xE2t at\xE9 at\xEB at\xF3pase auch auction aucun aucune audience audiences audiencia audio auf aufgebaut aufgef\xFChrt aufgegeben aufgel\xF6st aufgenommen aufgestellt aufgeteilt aufgrund aufmerksam auftreten auga auge augmentation augmenter august augusta augusti augustil augustus august\u0101 augusztus aujourd aula aumenta aumentando aumentar aumento aun aunque auparavant aupr\xE8s auquel aur aura auraient aurait aurie aurka aurkitu aurrera aus ausencia ausgebaut ausgebildet ausgef\xFChrt ausgeschlossen ausgestattet ausgestellt ausgestrahlt ausgetragen ausgewiesen ausgew\xE4hlt ausgezeichnet ausschlie\xDFlich aussi aust australiana australiano australis australischen austriaca austriaco austro aut autant autel autem auteur auteurs author authored authorities authority authorized authors auto autobiography autobus automatic automatically automatisch automne automobile autom\xF2bil autom\xF2bils autonoma autonome autonomia autonomie autonomous autonom\xEDa autor autora autore autorem autores autori autoria autoridad autoridade autoridades autorit\xE0 autorit\xE9 autorit\xE9s autoroute autors autorstwa autour autre autrefois autres autumn autunno aut\xF3noma aux auxiliar au\xDFen au\xDFer au\xDFerdem au\xDFerhalb avaient availability available avait aval avance avant avantage avanti avanzata ave avea avec avendo avenida avenir aventura aventuras aventure aventures avenue aver average averaged avere aves avesse aveva avevano avgust avgusta aviat aviation avientu avion aviones avions avis avi\xE1 avi\xF3n avled avo avocat avoid avoir avons avqust avrebbe avrebbero avril avrinningsomr\xE5det avsnitt avui avulla avut avuto avvattnar avvenne avventura avvenuta avvenuto avversario avviene avvocato av\xE2nd av\u0161ak awal awalnya awam awans awansowa\u0142 award awarded awards aware awareness away awer awon axe axis aya ayah ayahnya ayant ayat ayisyen ayn\u0131 ayr\u0131 ayr\u0131ca ayuda ayudar ayud\xF3 ayuntamiento ay\u0131nda azalera azaleran azaz azienda aziende azione azioni azken azok azon azonban azonos azpian azt azul azy azzal az\xE9rt az\u0259rb a\xE7\xE3o a\xE7\xF5es a\xE7\u0131k a\xE9rea a\xE9reo a\xE9rienne a\xE9roport a\xEDnda a\xEEn\xE9 a\xF1o a\xF1os a\xF1u a\xFAn a\u011F\u0131r a\u015Fa\u011F\u0131 a\u0219a baada baan babak babas\u0131 baby bachelor bacino back backed background backing backup bacteria bad bada badag badan badania bada\u0144 badly badminton bag bagaimana bagaimanapun bagi bagian bag\xE9an bahagi bahagian bahan bahari bahasa bahawa bahin bahkan bahwa bah\xEDa bai baie baig\u0117 baik baile baina baino bairro baisse baita baix baixa baixo baja bajas bajnok bajnoki bajnoks\xE1g bajo bak bakal bakar bakarra bakarreko bakarrekoak bakarrik bakoitzeko bakom bal bala balance balandlikda baland\u017Eio balas bald balik ball ballad ballet ballot balls baloncesto bambini bambino ban bana banatuta banca bancian banco bancos band banda bandar bandas bande bandeira bandera bandes bandet bando bands bane banen bang bangsa bangunan banjo banjur bank banking bankruptcy banks banku banky banlieue banned banner banor\xEB banque bansa bansang bantuan banyak bao baolina bapori bar bara barambuik barang barangay barat barco barcos bardziej bardzo bare barn barna barne baron baroque barra barrage barre barrel barri barrier barrio barrios barroco barrskog barruan barruko barrutian bars baru barubah barwach barzh bar\u0259d\u0259 bas basa basada basado basal basata basato base baseada baseado baseball based basement basen baseret basert bases basi basic basiert basilica basin basis basket basketball basowa basque bass bassa basse bassin bassist basso bastante bas\xE9 bas\xE9e bat bataille bataillon batalha batalion batalionu bataljon batalla batang batas batean bateau bateaux batek baten batera bateria baterista bater\xEDa batez battaglia battalion battalions batteria batterie batteries battery batting battle battles battu battuto batu batzuk bauen baute bavi bawah baxmayaraq bay bayan bayerischen baza bazas\u0131 bazen bazie baz\u0103 baz\u0131 ba\u011Fl\u0131 ba\u015F ba\u015Fa ba\u015Far\u0131l\u0131 ba\u015Fka ba\u015Fkan\u0131 ba\u015Flad\u0131 ba\u015Flam\u0131\u015Ft\u0131r ba\u015Flar ba\u015Flayan ba\u015Flay\u0131r ba\u015Fqa ba\u015F\u0131na ba\u015F\u0131nda ba\u017Eny\u010Dia bbc beach beam bear bearing bears beat beaten beating beats beau beaucoup beauftragt beautiful beauty beaux bebas beberapa bebyggelse became because become becomes becoming bed bedeutende bedeutenden bedeutendsten bedeutet bedient bedoeld bedraagt bedre bedrijf bedrijven bedste beeinflusst beeld been beendet beendete beer beetle beetles befand befanden befinden befindet befinner befolkad befolkning befolkningen before bef\xF6rdert began begann begannen begge begin beginnen beginning beginnt begins begint begitu begleitet begon begonnen begraafplaats begraven begrenzt begun begyndelsen begyndte begynnelsen begynte behaalde behalf behandelt behandling behar behavior behaviour beheer behind behoorde behoort behoren behov behulp bei beide beiden beider beigesetzt beig\u0101s beim being beispielsweise bekam bekannt bekannte bekannten bekanntesten bekas bekend bekende bekendste bekerja bekommen bel bela belajar belakang belang belangrijk belangrijke belangrijkste belas belegt belegte belga belge beliau belief beliefs believe believed believes believing beliggende bell bella belle belles belleza belli bello bells belong belonged belonging belongs below bels\u0151 belt belum bel\xE4gen bel\xF6danis bel\xFCl bel\u0259 bem ben benachbarten benannt benannte benar bench benda bene beneath beneficio beneficios benefit benefits beni benn benne benoemd bens bentuk benutzt benvenguda benyttes benyttet benywaidd benzer ben\xF6tigt beobachtet bepaald bepaalde bera beraber berada berakhir berarti berasal berat berbagai berbahasa berbanding berbeda berbentuk berbeza berdasarkan berdiri bere berean bereiken bereikt bereikte bereit bereits berfungsi berg bergabung bergerak bergig bergspass bergstopp berhasil beri berichtet berikut berikutnya berisi berita berjalan berjaya berjudul berkaitan berkata berkembang berkuasa berlaku berlangsung bermain bermula bern bernama berne beroep beroperasi berpindah berre berri berriz bersama bersempadan bersifat bertahan bertan bertemu bertsioa berubah berufen berumur berupa berusaha berusia berwarna besar besa\xDF beschikbaar beschloss beschlossen beschouwd beschreibt beschreven beschrieb beschrieben beschr\xE4nkt besch\xE4digt besch\xE4ftigt besch\xE4ftigte besetzt besiedelt besitzen besitzt beskou beskrevet beskrevs beskriver beslaat besloot besloten besluit besoek besoin besoins besondere besonderen besonders besser best bestaan bestaande bestaat bestand bestanden beste bestehen bestehend bestehende bestehenden besteht bestelako bestemt bestemte besten bester bestimmt bestimmte bestimmten bestod bestond bestritt bestuur bestuurlijk bestuurslaag best\xE4tigt best\xE5ende best\xE5r besucht besuchte bet beta betegnelsen beteiligt beteiligte betek betekenis betekent beter beton betrachtet betreft betreibt betrekking betrieb betrieben betrokken betrug betr\xE4gt better between betydelig betyder betydning betyr beubeulahan bevat beveik bevinden bevindt bevolking bevolkingsdichtheid bevor bewaard bewegen beweging bewerkingsgeschiedenis beyaz beyn\u0259lxalq beyond bez bezala beza\xF1 bezeichnet bezeichnete bezieht beziehungsweise bezig bezit bezocht bezogen bezpiecze\u0144stwa bezpo\u015Brednio bez\xFCglich be\u015F bhfuil bhliain bh\xED biais bianca bianchi bianco biart bias biasa biasanya biaso biasonyo bibliography biblioteca biblioteka biblioth\xE8que bicolor bic\xED bid bidang bidez bidrag bid\xE4da bid\xE4das bieg biegu bien bienes biens bient\xF4t bieten bietet bifl\xF6desordning big bigarren bigger biggest bihurtu bij bija bijis bijna bijvoorbeeld bijzonder bike bikoteak bil bila bilakaera bilan bilang bilangan bildades bilden bilder bildet bildete bildeten bile bilen bilgi bili bilik bilim bilinen bilinir bill billion bilo bil\u0259r bin binary bind binding bine binh binne binnen binon bintang bio biografia biography biological biology bir bird birdlife birds biri biridir birinci birka\xE7 birlikd\u0259 birlikte birth birthday biru bir\xE7ok bir\u017Eelio bis bisa bisbe biserica bisericii biseric\u0103 bisher bisherigen bishop bishops biskop biskup biskupa biskupem bislang bisnis bisogno bispo bisschop bit bitartean bitartez biti bitke bitki bits bitter bitv\u011B bitwie biv\u0161i biz bizantina bizantino bizi bizilekua bizonyos biztanle biztanleak biztanleria biztanleriaren bi\xEAn bi\u1EBFn bi\u1EBFt bi\u1EC3n bi\u1EC3u bi\u1EC7t black blad blade bladhaantjes blanc blanca blanche blanco blancos blancs bland blandskog blandt blant blau ble bleef bleek blei bleiben bleibt blessure bless\xE9 bless\xE9s bleu blev bleven blevet bli blieb blieben blijft blijkt blijven blind blir blisko blitt blive bliver blivit blizini blizu bloaz bloc block blocked blocks blocs blog blogspot blok blood bloque blot blots blow blu blue blues bly blz bl\xE4gans bl\xE5 bl\xEDzkosti bnf boa board boarding boards boat boats bob bobl boca bod boda bodde bodem bodies body bod\u016F boek boeken bog boga bois boj boja boje boji bok boken bokm\xE5l boktorren boku bol bola bold boleh bolesti boli bolj bolje bolo bol\xE8 bom bomb bomba bombe bomber bombers bombing bombs bon bona bond bonds bone bones bong bonne bonnes bons bonus book books boom boot bor borbe borbi bord borde border bordered borders bordo bore boreal boreala boren borgo born borough bort bos boshqa boshqalar bosque bosques boss bost bot boten both botiga botten bottom bot\xE1nica bot\xE1nico bot\xE2nico bou boud bought boulevard bound boundaries boundary bounded bourg bout bouw bouwen boven bow bowiem bowl bowling box boxer boxes boxing boy boyfriend boys boyunca bra braccio brach bracht brachte brachten bracksteklar brain brak braku bramek branca branch branche branches branco brand brands brani brano bras brasileira brasileiro brasileiros brasiliano brass brat brata brazo brazos bra\u0142 break breaking breaks breast bred brede breed breeding breit breite breiten brengen breton brev breve brevemente brevet brevi brez brezel brezhoneg brick bridge bridges brief briefly brigada brigade brigadier bright brillante bring bringen bringing brings bringt brit britannica britannico britannique britanniques britanski britische britischen britischer britisk britiske brittisk brittiska brit\xE0nic brit\xE0nics brit\xE1nica brit\xE1nico brit\xE1nicos brit\xE2nica brit\xE2nico bro broad broadcast broadcasting broadcasts broer broers broj broja brojne broju broke broken brokparasitsteklar bron bronce broni brons bronse bronz bronze bronzo bror brosiectau brother brothers brought brown browser brug bruges brugt bruk brukar bruke bruker brukes brukt brukte brun brutal brytyjski brzegu brzo br\xFBkt br\u0105zowy buah budapesti budaya bude budget budova budovy budowy budow\u0119 budu\u0107i budynek budynku buen buena buenas bug bugnaw build building buildings built buiten bukan bukid bukter bukti buku bulan bulegoa bulk bulunan bulundu bulundu\u011Fu bulunmaktad\u0131r bulunur bumi bun buna bunda bundan bunga bungo bungto bungtod bunu bunun bun\u0103 buon buona buque buques burada bureau bureaux burgemeester burial buried burned burning burua burung buruzko bus busca buscando buscar buses business businesses businessman busklandskap but buts butterfly buurt buvo buy bu\u010F bu\u1ED5i bu\u1ED9c byen byens byer bygd byggdes bygge bygger bygget bygningen bygninger byl byla byli bylo byly byrja byte bytte byw by\u0107 by\u0142 by\u0142a by\u0142o by\u0142y by\u0165 bzw b\xE0i b\xE0n b\xE0o b\xE0y b\xE1c b\xE1n b\xE1nh b\xE1o b\xE1r b\xE1sica b\xE1sico b\xE1sicos b\xE2timent b\xE2timents b\xE3i b\xE3o b\xE4ldot b\xE4ldoti b\xE4ldot\xFC b\xE4sta b\xE5da b\xE5de b\xE8zb\xF2l b\xEAn b\xEBr\xEB b\xECnh b\xF3ng b\xF6lge b\xF6lgesinde b\xF6l\xFCm b\xF6l\xFCm\xFC b\xF6rjade b\xF6rjan b\xF6rjar b\xF6y\xFCk b\xF8ker b\xF8r b\xF8rn b\xFAsqueda b\xFCrc\xFC b\xFCt\xFCn b\xFCy\xFCk b\xFDt b\xFDval\xFD b\xFDv\xE1 b\u0103ng b\u0105d\u017A b\u0119dzie b\u011Bhem b\u0159ehu b\u0159ezna b\u0159eznu b\u016Bt b\u016Bti b\u01B0\u1EDBc b\u01B0\u1EDBm b\u0259dii b\u0259y b\u0259zi b\u1EA1c b\u1EA1i b\u1EA1n b\u1EA3n b\u1EA3ng b\u1EA3o b\u1EA5t b\u1EA7u b\u1EADc b\u1EAFc b\u1EAFn b\u1EAFt b\u1EB1ng b\u1EC7nh b\u1ED1n b\u1EDFi b\u1EE5ng b\u1EE9c caballer\xEDa caballo caballos cabang cabe cabecera cabeza cabe\xE7a cabin cabinet cable cables cabo cabu caccia cache cada cadena cadet cadre cadrul caduta cael caer caf\xE9 cahaya cai caipital caixa caja cal calciatore calcio calcium calcul calculated calculation calculer calendar calendario calendrier cales calibre calidad call calle called calles calling calls calon calor calquera cam cambia cambiar cambio cambios cambi\xF3 cambra came cameo camera cameras caminho camino caminos camp campagna campagne campagnes campaign campaigns campanha campanile campanya campa\xF1a campa\xF1as campeonato campeonatos campe\xE3o campe\xF3n campi camping campionat campionati campionato campione campioni campo campos camps campu campuran campus cam\xED can canadese canadien canadienne canadiense canal canale canales cancelled cancer canciones canci\xF3n cand candidat candidata candidate candidates candidato candidatos candidats candidatura cando cane cannoni cannot canon canons canta cantando cantant cantante cantar cantata cantidad cantidades cantid\xE1 canto canton cantons cantor cantora cant\xF3 cant\xF3n cant\xF9 canvi canviar canvis canzone canzoni can\xE7ons can\xE7\xE3o can\xE7\xF3 can\xE7\xF5es cao cap capa capabilities capability capable capace capaces capacidad capacidade capacitat capacity capacit\xE0 capacit\xE9 capaz capbaix capela capella capensis capilla capita capitaine capital capitala capitale capitano capitolo capit\xE1n capit\xE3o capo capoluogo cappella caps captain captura capturado capturar capture captured caput cap\xEDtulo cap\xEDtulos car cara carabidae caracteres caracteriza caracterizat\u0103 caracter\xEDstica caracter\xEDsticas caracter\xEDstiques caract\xE8re caract\xE8res caract\xE9ristique caract\xE9ristiques caract\xE9ris\xE9e carattere caratteristica caratteristiche caratterizzata caratterizzato carbon carbone carbono carcere card cardenal cardinal cardinale cards care career careers carga cargo cargos cargu carica carico carnaval carne carreira carrer carrera carreras carretera carri carried carrier carriera carriers carries carri\xE8re carro carros carry carrying carr\xE9 cars carstva carta cartas carte cartes cartoon carved car\xE0cter car\xE1cter cas casa casada casades casado casal casamento casar casas casco case cases cash casi casino caso casos casou cassette cassini cast castell castellano castello castell\xE0 castell\xE1n castelo castel\xE1n castillo casting castle casu casualties cas\xF3 cat catalana catalog catalogue catal\xE0 catal\xE1n catatan catch catedral categoria categorias categorie categories category categor\xEDa categor\xEDas catena cathedral catholique catholiques cath\xE9drale catro cattedrale cattle cattolica cattolico cat\xE9gorie cat\xE9gories cat\xF3lica cat\xF3lico cat\xF3licos caudal caught causa causada causando causar causas cause caused causes causing caus\xF3 cauza cavalerie cavalleria cavallo cavalry cave caves cay\xF3 caza cazul ca\xE7a ca\xEDda ca\xF1ones ca\xF1\xF3n ca\u0142ego ca\u0142ej ca\u0142kowicie ca\u0142y ca\u0142ym ca\u0142\u0105 cca cchi\xF9 cdot cea ceased cedits ceea ceety cei ceiling ceinture cel cela cele celebra celebraci\xF3n celebrada celebrado celebrar celebrate celebrated celebration celebre celebrity celebr\xF3 celem celeste celf celkem cell celle celles cello cells cellule cellules celo celor celou celu celui celular cel\xE1 cel\xE9 cel\xE9ho cel\xFD cemento cemetery cena cenas cens censats censimento censo censura census censusindia cent centaines centar center centered centers centimeter centim\xE9ter cento centra central centrala centrale centrales centras centre centres centri centro centrocampista centros centrs centru centrul centrum cents centura centuries century cent\xEDmetros cenu ceny cepat cependant cerca cercana cercano cercare cercle cerebral ceremonia ceremonial ceremonies ceremony cerimonia cerita cerkev cero cerro certa certain certaine certaines certainly certains certificate certification certifications certified certo cer\xE1mica ces cesarza cesse cesta ceste cestista cestu cesty cet cette ceux cez cgi cha chacun chacune chain chains chair chairman chalcidoids challenge challenged challenges challenging chama chamada chamadas chamado chamados chamber chambre champ champion championnat championnats championne champions championship championships champs chan chance chances change changed changement changements changer changes changing channel channels chanselye chanson chansons chant chante chanteur chanteuse chantier chaos chapel chapelle chapitre chapter chapters chaque char character characteristic characteristics characterization characterized characters charakter charakterze charbon charge charged charges charg\xE9 charg\xE9e charity chart charter charts chasse chasseurs chassis chat cha\xEEne chce che check checklist chef chefe chefo chefs chega chegada chegando chegar chegou chemical chemin chemins chemische chemistry cherche chercheurs chess chest cheval chevalier chevaux chez chi chia chiama chiamata chiamati chiamato chiar chiaro chiave chica chiede chief chien chiesa chiese chiffre chiffres child childhood children chilena chileno chilometri chim chimie china chinesischen chini chino chinois chinoise chip chitarra chitarrista chiuso chiusura chi\u1EBFc chi\u1EBFm chi\u1EBFn chi\u1EBFu chi\u1EC1u cho chocolate choice choir choisi choisit choix chom chomh choose choroby chorus chose chosen choses cho\u0107 chrefft christlichen chromosome chronic chr\xE9tienne chr\xE9tiens chu chuid chun chung chur church churches chute chuy\xEAn chuy\u1EBFn chuy\u1EC3n chuy\u1EC7n chu\u1EA9n chu\u1ED3n chwili chyfrannwch ch\xE2n ch\xE2teau ch\xE2u ch\xE9ad ch\xE9ile ch\xED ch\xEDnh ch\xF3 ch\xF3ng ch\xF9a ch\xFA ch\xFAa ch\xFAng ch\u0153ur ch\u01A1i ch\u01B0a ch\u01B0\u01A1ng ch\u1EA1y ch\u1EA3y ch\u1EA5p ch\u1EA5t ch\u1EB3ng ch\u1EB7n ch\u1EBF ch\u1EBFt ch\u1EC9 ch\u1EC9nh ch\u1ECBu ch\u1ECDn ch\u1ED1ng ch\u1ED3ng ch\u1ED7 ch\u1EE7 ch\u1EE7ng ch\u1EE9a ch\u1EE9c ch\u1EE9ng ch\u1EEF ch\u1EEFa cia\u0142a cibo ciclismo ciclista ciclo cidade cidades ciddi ciel cielo cien ciencia ciencias cient\xEDfica cient\xEDficamente cient\xEDfico cient\xEDficos cierta ciertas cierto ciertos cifra cijfers cikk cila cilat cild cili cilis cilj cil\xEBt cima cimeti\xE8re cimitero cinc cinci cinco cincuenta cine cineasta cinema cinematografica cinematografiche cinematografico cinematogr\xE1fica cinese cinq cinquanta cinquante cinque cinqui\xE8me cinsin\u0259 cinta cintura cin\xE9ma cio\xE8 circa circiter circle circles circond\xE0re circonscription circuit circuito circuits circulaci\xF3n circular circulation circumstances circunstancias ciri cirka cit cita citada citado citation citato cite cited cities citing citizen citizens citizenship citoyens cittadina cittadini cittadino citt\xE0 city cit\xE0 cit\xE9 cit\xE9s ciudad ciudadanos ciudades ciudaes ciudat ciud\xE1 ciutat ciutats civil civile civiles civili civilian civilians civilisation civils ci\xEAncia ci\xF2 ci\u0105gu claim claimed claiming claims clair clan clar clara claramente clarinet claro clase clases clasificaci\xF3n class classe classement classes classic classica classical classico classifica classificaci\xF3 classificades classificassion classificata classification classifica\xE7\xE3o classified classique classiques classis class\xE9 class\xE9e clause clave clay clean clear cleared clearly clerk clero client cliente clientes clients clima climat climate climb climbing clinical clip clocher clock close closed closely closer closest closing closure clothes clothing cloud club clube clubes clubs cluster cl\xE1sica cl\xE1sico cl\xE1sicos cl\xE9 cl\xE9s cl\xEDnica cmentarzu coa coach coached coaches coaching coal coalici\xF3n coalition coas coast coastal coat coberta cobertos cobertura cobre coche coches cocina coda code codes codi codice coffee cognitive coi coin coincide coins coisas col cola colaboraci\xF3n cold colecci\xF3n colegio coles cole\xF3ptero coli coll collaborated collaboration collaborazione collapse collapsed colleagues collect collecte collected collectie collectif collecting collection collections collective collectivit\xE9s collector collega collegamento college colleges collegio collezione colline collision coll\xE8ge colocado colocar colombiana colombiano colonel colonia colonial coloniale colonias colonie colonies colonna colonne colonnello colonnes colonos colons colony color colore colored colores colori coloro colors colos colour colours colpi colpito colpo column columna columnas columns com coma comandament comandant comandante comando comarca combat combate combates combats combattere combattimento combinaci\xF3n combinatie combination combine combined combustible come comeback comedia comedian comedy comenzaron comenz\xF3 comen\xE7a comen\xE7ament comen\xE7ar comer comerciais comercial comerciales comercials comerciantes comercio comer\xE7 comes comezou come\xE7a come\xE7aram come\xE7o come\xE7ou comic comics comida comienza comienzo comienzos comincia cominci\xF2 coming comisi\xF3n comit\xE9 command commandant commande commanded commandement commander commanding comme commedia commence commenced commencent commenc\xE9 comment commentary commented comments commen\xE7a commerce commercial commerciale commerciali commercially commercio commissaire commission commissione commissioned commissions commitment committed committee committees common commonly commun communal communautaire communaut\xE9 communaut\xE9s communaux commune communes communication communications communis communist communiste communities community communium como compact compagni compagnia compagnie compagnies compagno companhia companies companion company companyia comparable comparaci\xF3n comparative compare compared comparison compatible compa\xF1ero compa\xF1eros compa\xF1\xEDa compa\xF1\xEDas compensation compete competed competencia competiciones competici\xF3 competici\xF3n competing competir competitie competition competitions competitive competitors competizione competizioni competi\xE7\xE3o compilation compiled compiti\xF3 compito complejo complement complesso complet completa completamente completar complete completed completely completing completion completo complex complexe complexes complexity complexo complexos complicated compl\xE8te compl\xE8tement compone component componente componentes componenti components componist comporta comportamento comportamiento comporte comportement compose composed composer composers composici\xF3 composici\xF3n compositeur composition compositions compositor compositore compositores composizione composi\xE7\xE3o composta composto compostos compos\xE9 compos\xE9e compos\xE9s compound compounds compra comprar comprehensive comprenant comprend comprende comprendre compresa compreso compression comprimento compris comprise comprised comprises comprising compta comptait compte compter comptes compuesta compuesto compuestos computador computer computers computing comp\xE9tences comp\xE9tition comp\xE9titions comtat comte comtes comt\xE9 comu comum comun comuna comunale comunas comune comunei comunemente comunes comuni comunica comunicaci\xF3 comunicaci\xF3n comunicazione comunica\xE7\xE3o comunidad comunidade comunidades comunid\xE1 comunista comunistas comunitat comunit\xE0 comunque comuns comun\u0103 com\xE9dia com\xE9die com\xE9rcio com\xFA com\xFAn com\xFAnmente con conca conceito conceived concelho concello concentraci\xF3n concentrated concentration concept concepte conception concepto concepts concern concernant concerne concerned concerning concerns concert concerti concerto concertos concerts concession concetto conceyu conciencia concierto conciertos conclude concluded concluse conclusion concorso concours concretamente concrete concreto concurrence concurrent concurso condado condados condamn\xE9 conde condemned condenado condiciones condicions condici\xF3n condition conditions condizione condizioni condi\xE7\xE3o condi\xE7\xF5es condotta condotto conduce conduct conducta conducted conducting conductor conduit conduite condus coneguda conegut coneguts coneix conexi\xF3n conference conferences conferencia confiance confianza confidence configuration confine confini confirme confirmed confirm\xF3 conflict conflicte conflicto conflictos conflicts conflit conflito conflitto confluence conform conforme confronti confronto confused confusion conf\xE9rence conf\xE9rences congregation congressional congr\xE8s conhecida conhecido conhecidos conhecimento conjunction conjunt conjunto conjuntos connaissance connaissances conna\xEEt conna\xEEtre connect connected connecting connection connections connects connu connue connues connus conoce conocer conocida conocidas conocido conocidos conocimiento conoci\xF3 conoc\xEDu conosce conoscenza conosciuta conosciuto conquered conquest conquista conquistando conquistar conquistou conqu\xEAte consacre consacr\xE9 consacr\xE9e conscience consciousness consecuencia consecutive consegue conseguenza conseguido conseguir conseguiu conseil conseiller conseillers conseils consejo consenso consensus consent consente consequence consequences conseq\xFC\xE8ncia conserva conservaci\xF3n conservador conservan conservar conservateur conservation conservative conservato conserve conserver conserv\xE9 consider considera consideraba considerable considerably considerada consideradas considerado considerados consideran considerando considerar considerat considerata consideration considerato considerava considered considering considers consider\xF3 consid\xE8re consid\xE9r\xE9 consid\xE9r\xE9e consiglio consigue consigui\xF3 consist consiste consisted consistent consistente consistently consisting consists console consommation conspiracy consta constant constante constantemente constantes constantly constitit constitucional constituci\xF3n constitue constituency constituent constitution constitutional constituye constitu\xE9 constitu\xE9e construcci\xF3 construcci\xF3n construci\xF3n construct constructed construction constructions construida construido construir construire construit construite construits construit\u0103 construy\xF3 constru\xE7\xE3o constru\xEDda constru\xEDdo constru\xEFt consul consulta consultant consult\xE9 consumer consumers consumo consumption cons\xE9quence cons\xE9quences cons\xE9quent cont conta contaba contact contacte contacto contacts contain contained containing contains contando contar contato contatto contava conte contea contemporain contemporaine contemporanea contemporaneamente contemporary contenant contenente contenido content contents contenu contenuti contenuto conten\xEDu contes contest contestant contestants contested contesto context contexte contexto conte\xFAdo contiene contienen contient continent continental continentale continente continu continua continuaci\xF3n continuamente continuar continuare continuat continue continued continues continuing continuo continuou continuous continuously continu\xF2 continu\xF3 contin\xFAa conto contoh contou contour contra contract contracted contracts contraire contrairement contrari contrario contrast contraste contrat contratado contrato contratto contre contribute contributed contributing contribution contributions contributo contro control controlar controle controlled controlling controllo controls controversial controversy contr\xE1rio contr\xF4le cont\xE9 cont\xE9m cont\xF3 convencional convent convention conventional conventions convento conversation conversion convert converted convertido convertir convertirse convicted conviction convierte convince convinced convirti\xE9ndose convirti\xF3 convocado convoy conxunto conxuntu con\xE7u con\xE8ixer cooking cool cooperation coop\xE9ration coordenadas coordinate coordination cop copa copaon copertina copia copias copie copies copii copper coppia copy copyright cor coral coraz coraz\xF3n corda cordes core coreano cores cori corn corner coro corona coronel coros corpi corpo corporal corporate corporation corporations corpos corps corpus corre correct corredor corrent corrente correr correspond correspondant corresponde corresponden correspondence correspondent correspondiente corresponding corresponia corrida corriente corrientes corrispondenza corruption corsa corse corsi corso cort corta corte corto cortometraggio coru\xF1\xE9s cos cosa cosas cose coses cosiddetta cosiddetto cost costa costante costas costat coste costi costituisce costituita costituito costituzione costo costretto costruire costruita costruito costruzione costs costume costumes cos\xEC cotton couche could couldn couleur couleurs council count counted counter counties countries country counts county countyt coup coupe couple coupled couples coups coup\xE9 cour courage courant coureur coureurs couronne cours course courses court courte courts cousin couvent couverture couvre cover coverage covered covering covers co\xF1ecida co\xF1ecido co\xFBt co\u017E craft crash crashed crea creaci\xF3 creaci\xF3n creada creado creador cream creando crear creare creat creata create created creates creating creation creative creato creator creature creazione creciente crecimiento creci\xF3 crede credit credited credits cree creek creixement crescente crescimento crescita creu crew cre\xF3 criada criado crian\xE7a crian\xE7as criar cria\xE7\xE3o cricket cricketer crime crimes criminal criou crise crisi crisis cristal cristiana cristianismo cristiano cristianos criteria critic critica critical critically critici criticised criticism criticized critico critics critique critiques crkva crkve croata croce croissance croix cronfeydd crop crops cross crossed crosses crossing crossover crowd crown crowned crucial cruel cruise cruz crystal cr\xE9ation cr\xE9ditos cr\xE9dit\xE9 cr\xE9e cr\xE9er cr\xE9\xE9 cr\xE9\xE9e cr\xEDtica cr\xEDticas cr\xEDtico cr\xEDticos csak csal\xE1d csal\xE1dj\xE1ba csapat csapatok csatlakozott csoport csup\xE1n cs\xE1sz\xE1r cuadrados cuadro cuadros cual cuales cualos cualquier cuando cuanto cuarenta cuarta cuarto cuartos cuatro cubic cubierta cuenca cuenta cuentan cuentos cuerpo cuerpos cuerpu cuesti\xF3n cui cuidado cuisine cuius cuja cujo cukuik cukup culpa cult culte cultivo cultivos culto cultura culturais cultural culturale culturales culturali culturas culture culturel culturelle cultures cultuur cum cumplir cumuni cum\xFCn cun cunf\xECna cung cunha cunoscut cunoscute cunoscut\u0103 cuore cup cura cure currency current currently curriculum curs cursa curso cursos curta curva curve cur\xE9 custo custodian custody custom customer customers customs cut cuts cutting cuya cuyas cuyo cuyos cu\u1ED1i cu\u1ED1n cu\u1ED9c cycle cycles cycliste cyklu cylinder cyn cynnwys cyntaf cyrillique czas czasach czasem czasie czasu czas\xF3w czego czele czerwca czerwcu czterech cztery czy czyli czym cz\u0119sto cz\u0119\u015Bci cz\u0119\u015Bciowo cz\u0119\u015Bci\u0105 cz\u0119\u015B\u0107 cz\u0142onek cz\u0142onkiem cz\u0142onk\xF3w cz\u0142owieka c\xE0ng c\xE0rrec c\xE1c c\xE1ch c\xE1i c\xE1mara c\xE1ncer c\xE1nh c\xE1o c\xE1pita c\xE1rcel c\xE2n c\xE2nd c\xE2t c\xE2teva c\xE2u c\xE2y c\xE2\u0219tigat c\xE8l c\xE9g c\xE9lebre c\xE9lja c\xE9lula c\xE9lulas c\xE9l\xE8bre c\xE9l\xE8bres c\xE9r\xE9monie c\xEDlem c\xEDmet c\xEDmmel c\xEDm\u0171 c\xEDrculo c\xEDrkve c\xEDsa\u0159e c\xF2n c\xF3digo c\xF3mo c\xF3pias c\xF3rka c\xF3rki c\xF3rk\u0119 c\xF4n c\xF4ng c\xF4te c\xF4tes c\xF4t\xE9 c\xF4t\xE9s c\xF9ng c\xFApula c\xFCm\xFC c\u0103n c\u0103s\u0103torit c\u0103tre c\u0153ur c\u0169ng c\u01B0\u1EDDng c\u0259nub c\u1EA1nh c\u1EA3i c\u1EA3m c\u1EA3ng c\u1EA3nh c\u1EA5p c\u1EA5u c\u1EA7m c\u1EA7n c\u1EA7u c\u1EADn c\u1EADp c\u1EADu c\u1EAFt c\u1ED9ng c\u1EE7a c\u1EE9ng c\u1EE9u c\u1EEDa c\u1EF1c daar daarbij daardoor daarin daarmee daarna daarom daarop daarvan daarvoor dab daba dabar dabei dac\u0103 dad dada dades dadi dado dados dadurch daerah daftar daf\xFCr dag dagar dagat dage dagegen dagen dagens dager daging dagli dago dagoen dagoena daha daharampehintany daharanjarahasin daher dahil dahin dahulu dai daily dain\u0173 dair daiteke daitezke daje dakbayan dakek daki dakong dal dala dalam dalar dalawang dalej daleko dalen dali dalis dalje dall dalla dalle dallo dalt dalyje dalyvavo dal\u012F dal\u0161\xED dal\u0161\xEDch dal\u0161\xEDmi dam dama damage damaged damalige damaligen damals dambos dame dames damit dan dana danach danas dana\u0161nje dance dancer dancing dando dane danes danger dangerous danh danitra dann danner dannet danni danno dans danse dansk danska danske danych danza dao daoine daou dapat dapek dapit dapprima daquele dar darab darah daran darauf daraufhin daraus darbo dare darf dargestellt dari darin daripada dark darrer darrere darr\xE9u darstellen darstellt darunter dar\xFCber das dasar dass dat data database databases datang datant datblygu date dated dates dati datiert dating dato datorit\u0103 datos datt datter datu datuen datum dat\u0103 dau daude dauden daudz daug daughter daughters daugiau daugiausia daun davall davam davant davantage davanti davlat davon dav\xE6rende dawna dawniej daxil day daya dayal\u0131d\u0131r days dazu da\xDF da\xF1os da\u011F da\u013Ca da\u013Cu da\u013C\u0101 da\u017Enai da\u017Eniausiai ddinas ddwyrain dea dead deal dealing deals dealt death deaths deb debajo debat debate debates debe deben deber\xEDa debido debi\xF3 debt debut debuted debuteerde debuterte debutto debut\xF3 debuut deb\xEDa deb\xEDan deb\xFCtierte decade decades deceased deceduto december decembra decembrie decembro decembr\u012B decenijama decenni decide decided decides decidieron decidir decidiu decidi\xF3 decir decise decision decisione decisiones decisions decisiva decisi\xF3n deciso decis\xE3o deck declara declaraci\xF3n declarada declarado declarar declarat declaration declared declarou declar\xF3 decline declined decoraci\xF3n decorated decorative decrease decreased decree decreto dec\xE2t dedica dedicada dedicado dedicar dedicat dedicata dedicated dedicato dedic\xF3 dee deed deel deels deelstaat deem deemed deen deep deeply def defa default defeat defeated defeating defence defend defended defender defending defensa defense defensive defensor defesa deficit define defined defines definici\xF3n definida definido definiert definir definita definition definitiva definitivamente definitivo definito definizione degli degre degree degrees degr\xE9 dehors dei deira deis deixa deixando deixar deixou deja dejando dejar dej\xF3 dek dekabr dekat deki dekul del dela delante delar delas delavrinningsomr\xE5de delay delayed dele delegation delen deler deles deliver delivered delivery dell della delle delles dello dellos delo dels delstaten delstatshuvudstaden delt delta deltog deltok delu deluje delvis del\xE0 dem demais demanar demand demanda demande demanded demander demands demasiado demeure demi demikian demo democracia democracy democratic demografiala demographics demolished demonstrate demonstrated demonstration demostrar dempu\xE8i dempu\xE9s dem\xE1s den dena denaro denboran denda dendak dende denen dengan denied deniz denken denn denna denne dennes dennoch denomina denominaci\xF3n denominada denominado denominata denominato denominazione dens dense denseso densidad densidade densidat densitat density densit\xE0 densit\xE9 dental dentre dentro dents denumirea deo deoarece depan departamant departamencie departamenduan departament departamenti departamentin departamento departamentos departamentul departed departemantan departement departemente departementet departmana departmanu department departments departure depende dependent dependiendo depending depends depi depicted depicting depicts deployed deployment depois deporte deportes deportista deportiva deportivo deposits depot depresi\xF3n depression depth depuis deputado deputy depu\xE9s dep\xF3sitos der dera deras derby derde derecha derecho derechos derefter deren deres deretter derfor deri derimot deriva derivada derivado derivados derived derives dermed dernier derniers derni\xE8re derni\xE8res derri\xE8re derrota derrotado derrotar derrot\xF3 derselben derzeit des desa desaparici\xF3n desarrolla desarrollado desarrollar desarrollo desarroll\xF3 desastre descendant descendants descendientes descenso descent descoberta descoberto descobrir descoperit describe described describes describing describi\xF3 descripci\xF3n description descriptions descris\u0103 descrita descrito descritto descubierto descubre descubrimiento descubri\xF3 desde desember desembre desempenho desempe\xF1\xF3 desenho desenvolupament desenvolupar desenvolvemento desenvolver desenvolveu desenvolvido desenvolvimento desenvolvimientu deseo desert deserto deset deshalb design designa designada designado designar designated designation designationibus designed designer designers designs desimaly desire desired desocupats despite despois despre despr\xE9s despu\xE9s dess dessa dessas desse desselben dessen desservie desses dessin dessins dessin\xE9e dessous dessus dessutom desta destaca destacada destacado destacados destacan destacando destacar destac\xF3 destaque destaquen destas deste destes destinada destinado destination destinato destino destin\xE9 destin\xE9e destra destrict destro destroy destroyed destroyer destroying destrucci\xF3n destruction destruir desuden det detail detailed details detalhada detalles detectar detection detective determina determinada determinado determinar determination determine determined detr\xE1s dets detsember detsembril detta dette detto deu deukeut deulu deur deus deutlich deutsch deutsche deutschen deutscher deutschsprachigen deux deuxi\xE8me devaient devait devam devant deve develop developed developer developers developing development developments develops devem devenant devenir devenit devenu devenue deveria device devices devido deviendra deviennent devient devine devint devlet devono devoted devrait dewa dewasa dex\xF3 deyil dez deze dezelfde dezembro dezha\xF1 dezy\xE8m de\u011Fil de\u011Fildir de\u0219i dhe dh\xE8w\xE8k\xE9 dh\xE9anamh dia diabetes diadakan diagnosed diagnosis diagnostic diagram diagrama dialect dialects dialetto dialogue diambil diameter diametro diam\xE8tre dianggap diangkat diante diari diario dias dibagi dibandingkan dibangun dibawa dibentuk diberi diberikan dibina dibintangi dibuat dibuka dica dice dicembre dich dicha dichiarato dicho dichos dicht dichter diciembre diciendo dicir dictadura dictionary did didirikan didn die diecezji dieci died diede diel dien dienas diende dienen diens dienst dient diente dienten dientro dier dieren dieron dies diese diesel dieselfde diesem diesen dieser dieses diesmal diet dieta dietro dieu diez difensore diferencia diferencias diferent diferente diferentes diferents diferite difer\xE8ncia difesa differ difference differences different differenti differential differenza difficile difficolt\xE0 difficult difficulties difficulty difficult\xE9 difficult\xE9s diffusa diffuse diffusion diffusione diffuso diffus\xE9 diffus\xE9e diff\xE9rence diff\xE9rent diff\xE9rentes diff\xE9rents dificultades difusi difusi\xF3n dif\xEDcil dig digantikan digital digitale digunakan dig\u0259r dihasilkan diikuti dij dijadikan dijela dijelom dijelu dijo dijual dikatakan dikeluarkan dikembangkan dikenal dikenali diketahui dikt dikwels dil dilahirkan dilaksanakan dilakukan dilantik dilengkapi dili dilihat dilind\u0259 dima dimana dimanche dimension dimensional dimensione dimensiones dimensioni dimensions dimiliki diminution dimpu\xE9s dimulai din dina dinamakan dinastia dinastije dinast\xEDa dinero dinheiro dinhi dini dinner dins dintr dintre dio diocese diocesi dioc\xE8se dios dioses diouzh dipakai dipak\xE9 dipanggil dipartimento dipartim\xE8nt diperlukan dipilih dipimpin dipinti dipinto diploma diplomat diplomatic diplomatik dipl\xF4me diproduksi diputado diputados dir dira dirbo dire direcci\xF3 direcci\xF3n direct directa directament directamente directe directed directement directeur directing direction directions directly directo director directora directors direita direito direitos direkt direkte direkten direktor direkt\xF8r diren diretamente diretor diretta direttamente diretto direttore direutor direzione dire\xE7\xE3o diri dirige dirigeants dirigent dirigente dirigida dirigido dirigir dirigit dirigi\xF3 dirig\xE9 dirig\xE9e dirilis dirinya diritti diritto diru dis disa disabled disabuik disappeared disaster disbanded disc dischi disciplina discipline disciplines disco discografica discogr\xE1fica discontinued discos discours discover discovered discovers discovery discretivam discrimination discu discurso discuss discussed discussion discussions disease diseases disebabkan disebut disegni disegno dise\xF1ado dise\xF1o disiarkan disk dismissed disorder disorders disparition disparu display displayed displays dispone disponibile disponibili disponible disponibles disposaven dispose disposici\xF3n dispositif disposition dispositivo dispositivos disposizione disputa disputada disputado disputar disputato dispute disputed disputes disputou disput\xF3 disque disques disse disseny disso dissolution dissolved distance distances distancia distans distant distante distanza distinct distinction distinctive distingue distinguish distinguished distinta distintas distintes distinto distintos distretto distribuci\xF3n distribuito distribui\xE7\xE3o distributed distribution distribuzione district districte districts distrik distrikt distriktet distrito distritos distruzione dist\xE0ncia dist\xE2ncia disutradarai dit dita ditabang ditabik ditamui ditamukan ditayangkan dite ditebang ditemui ditemukan diterbitkan diterima ditetapkan dito dits ditu ditubuhkan dituen ditulis dituzte dituzten diu div divadla divadlo divas divenne diventa diventando diventare diventato divers diversa diversas diverse diversen diverses diversi diversity diverso diversos divide divided dividida dividido dividir divina divine diving divisa divise divisi divisie divisio division divisione divisionen divisiones divisions divisi\xF3 divisi\xF3n divisjon divis\xE3o divizija divizije divorce divorced diwar dix dixo diye diz dizaine dizendo dizer dizi dizze di\xE1metro di\xE9 di\xF3cesis di\u011Fer di\u1EC5n di\u1EC7n di\u1EC7t djece djela djelo djup djur dla dlatego dle dlouh\xE9 dne dnes dne\u0161n\xED dni dnia dniach dniem dniu dn\xED doa doan doanh doar doare doarp doas dob doba dobe dobi dobil dobila dobili dobio doble dobles dobra dobre dobro dobrze dobu doby dob\u011B dob\u0159e doc doce docent docente doch dochter doch\xE1z\xED dock docteur doctor doctoral doctorat doctorate doctors doctrina doctrine document documentaci\xF3n documentaire documental documentario documentary documentation documented documenti documento documentos documents dodici dodjele dodnes doe doel doen doen\xE7a does doesn doet dog dogs doi doilea doing dois doit doivent dok dokonce dokter doktor doktora doktoru dokument dolara dolar\xF3w dolay\u0131 dolazi dolce dolgozott dolina doliny dollar dollari dollars dolor dom doma domain domaine domaines domains dome domenica domeniul domestic domi domicile domina dominant dominante dominated domination domingo domini dominio domo domov domu domy dom\xE1c\xED dom\xE8n dom\xEDnio dom\xF3w dom\u016F don dona donar donat donated donation donations donc doncs donde done dones dong donna donnant donne donnent donner donn\xE9 donn\xE9e donn\xE9es dono dont dood door doordat doors dopiero dopo doppia doppio doprava dopravy dopuniti dor dorp dorsal dort dortigen dos dose dosegel dossier dosta dostal dostala dosud dosz\u0142o dot dotata dotato dotter doua double doubles doubt dous doute douze dou\u0103 dove dovette doveva dovoljno dovr\xE0 dovuta dovuto down download downtown dow\xF3dca dow\xF3dcy dow\xF3dc\u0105 doze dozen do\u011Fal do\u011Fdu do\u011Fru do\u015B\u0107 do\u0161ao do\u0161lo dra draagt draft drafted drag dragen dragon drainage drama dramatic dramatique dramaturg drame drapeau draw drawing drawings drawn draws dre dream dreams dree drei dreimal dreist drept dress dressed dret dreta drets drev drew drie drift drink drinking dritte dritten drive driven driver drivers drives driving dro drodze drog droga drogas drogi droit droite droits dronning drop dropped dros drove drudis drug druga druge drugi drugie drugiego drugiej drugih drugim drugo drugog drugoj drugom drugs drug\u0105 druh druhej druhou druhu druhy druh\xE1 druh\xE9 druh\xE9ho druh\xFD druh\u016F druk drum drummer drums dru\u0161tava dru\u0161tva dru\u0161tvo dru\u017Cyn dru\u017Cyna dru\u017Cynie dru\u017Cyny drwy drwydded dry dr\xE1hy dr\u017Eava dr\u017Eave dr\u017Eavi dt\xED dua dual duas dub dubbed dubna duc duca duce duchowny duch\xE9 dud duda due duel duen duena duerch dues duet dug dugo duhet dui duidelijk duine duke dulce dum dun dunay dung dunha dunia dunque duo dupla dup\u0103 duque duquel dur dura durable duraci\xF3n durant durante durata duration durch durchaus durchgef\xFChrt durchsetzen dure durfte during duro durum dur\xE9e dur\xF3 dus dust dut dute duten duties duty duw\xE9 dux duy du\u017Ce du\u017Cej du\u017C\u0105 dva dvakr\xE1t dve dveh dvi dvije dvoch dvou dvs dv\xE4rgstritar dv\u011B dv\u011Bma dwa dwie dwoma dwukrotnie dw\xE8t dw\xF3ch dying dynamic dynamics dynastie dynastii dynasty dynol dyr dyrektor dyrektora dyrektorem dystrykcie dyt\xEB dywizji dzia\u0142a dzia\u0142acz dzia\u0142alno\u015Bci dzia\u0142alno\u015B\u0107 dzia\u0142ania dzia\u0142a\u0144 dzieci dziedzinie dzielnicy dzie\u0142a dzie\u0144 dzimis dzi\u0119ki dzi\u015B dzortut dzs d\xE0i d\xE0nh d\xE1le d\xE2n d\xE2y d\xE3y d\xE4nischen d\xE4r d\xE4refter d\xE4rf\xF6r d\xE4rmed d\xE8cada d\xE8s d\xE9bat d\xE9bit d\xE9but d\xE9bute d\xE9buts d\xE9cada d\xE9cadas d\xE9cembre d\xE9chets d\xE9cide d\xE9cident d\xE9cid\xE9 d\xE9cimo d\xE9cision d\xE9claration d\xE9clare d\xE9clar\xE9 d\xE9cor d\xE9couvert d\xE9couverte d\xE9couvre d\xE9couvrir d\xE9cret d\xE9crit d\xE9c\xE8s d\xE9c\xE9d\xE9 d\xE9di\xE9 d\xE9di\xE9e d\xE9faite d\xE9fendre d\xE9fense d\xE9fenseur d\xE9finit d\xE9finition d\xE9finitivement d\xE9i d\xE9j\xE0 d\xE9l d\xE9li d\xE9mocrate d\xE9mocratique d\xE9ning d\xE9part d\xE9partement d\xE9partemental d\xE9partementale d\xE9partementales d\xE9partements d\xE9pend d\xE9put\xE9 d\xE9put\xE9s d\xE9roule d\xE9sa d\xE9signe d\xE9signer d\xE9sign\xE9 d\xE9sormais d\xE9tail d\xE9taill\xE9 d\xE9terminer d\xE9truit d\xE9truite d\xE9veloppe d\xE9veloppement d\xE9velopper d\xE9velopp\xE9 d\xE9velopp\xE9e d\xEAr d\xEBl d\xEDa d\xEDas d\xEDes d\xEDj d\xEDjas d\xEDjat d\xEDky d\xEDla d\xEDlo d\xF2ng d\xF3lares d\xF3mina d\xF3na d\xF6d d\xF6nem d\xF6nemde d\xF6neminde d\xF6r d\xF6rd\xFCnc\xFC d\xF6rt d\xF6vl\u0259t d\xF6vrd\u0259 d\xF6vr\xFCnd\u0259 d\xF8d d\xF8de d\xF8mes d\xF8ydde d\xF9ng d\xFAas d\xFAo d\xFCnya d\xFCnyada d\xFCnyan\u0131n d\xFCnyaya d\xFCrfen d\xFCrfte d\xFCzenlenen d\xFC\xFCtsch d\xFC\u015F\xFCk d\u0113\u013C d\u0117l d\u011Bti d\u011Bt\xED d\u0131r d\u0131\u015F\u0131nda d\u0142ugo\u015Bci d\u0142ugo\u015B\u0107 d\u0159\xEDve d\u016Fm d\u016Fsledku d\u016Fvodu d\u01B0\u01A1ng d\u01B0\u1EDBi d\u01B0\u1EE1ng d\u0259f\u0259 d\u0259n d\u0259niz d\u1EA1ng d\u1EA1y d\u1EA5u d\u1EA7n d\u1EA7u d\u1EABn d\u1EADy d\u1EB7m d\u1ECBch d\u1ECDa d\u1ECDc d\u1EE5c d\u1EE5ng d\u1EF1a d\u1EF1ng eaa each ear earlier earliest early earn earned earning earste earth earthquake easier easily east eastern easy eat eating eau eaux ebbe ebben ebbero ebb\u0151l ebenda ebenfalls ebenso ebet eboluzioa ebrei ecc eccentricitatem eccentricit\xE0 eccezione echipa echt echte echter ecliptica eclittica economia economic economica economico economics economie economische economista economy econom\xEDa econ\xF3mica econ\xF3micas econ\xF3mico econ\xF3micos edad edasi edat edats ede edelleen eden eder ederek edge edges edhe edi edib ediciones edici\xF3 edici\xF3n edifici edificio edificios edificis edif\xEDcio edildi edilen edilir edilmi\u015F edilmi\u015Fdir edilmi\u015Ftir edilm\u0259si edil\u0259n edir edirdi edirl\u0259r edisi edit editado edited editie editing edition editions editor editora editore editores editorial editors edizione edizioni edi\xE7\xE3o edi\xE7\xF5es edo eds edu educaci\xF3 educaci\xF3n educated education educational educator educa\xE7\xE3o edukiaren edustaa edusti edycji ed\xE1 ed\u0259n ed\u0259r\u0259k een eenheid eenoogkreeftjessoort eens eerder eerdere eerst eerste eest eesti eeu eeuw efecte efectes efectiva efecto efectos efeito efeitos efekt efektif effect effective effectively effects effectue effectuer effectu\xE9 effectu\xE9s effekt effet effets effetti effetto efficace efficiency efficient effort efforts efter efterf\xF8lgende eftersom eftir ega egen egentlig eget egg eggs egin egindako egiteko egiten egli egna egne ego egoera egon egter egun egunean egy egyar\xE1nt egyben egyes egyetemi egyetlen egyh\xE1z egyh\xE1zi egyik egyike egykori egym\xE1s egyre egyszer\u0171 egy\xE9b egy\xFCtt egy\xFCttes eg\xE9sz eg\xE9szben eg\xE9szen ehe ehemalige ehemaligen ehemaliger ehemals eher ehess ehk ehr eie eige eigen eigenaar eigendom eigene eigenen eigener eigenes eigenst\xE4ndige eigentlich eigentliche eigentlichen eight eighteen eighth eik\xE4 eil eiland eilanden eile ein eina eind einde eindigde eindstand eine einem einen einer einerseits eines einfach einfache einfachen eingebaut eingef\xFChrt eingegliedert eingemeindet eingerichtet eingesetzt eingestellt eingetragen eingeweiht einige einigen einiger einmal einnig eins einschlie\xDFlich einst einzelne einzelnen einzige einzigen eit either eitt eius eiv\xE4t eje ejecuci\xF3n ejecutivo ejemplares ejemplo ejemplos ejercicio ej\xE9rcito eki ekipa ekki ekkor ekonomi ekonomik ekonomisi ekonomiska eks eksempel ekstra ela elaboraci\xF3n elaborate elan elanelany elas elde elder elderly elders eldest eldre eldste ele elecciones eleccions elecci\xF3n elecci\xF3ns elect elected election elections electo electoral electric electrical electricity electron electronic electronics electrons electr\xF3nica elegans elegante elegido elegir elegit eleiciones eleito elei\xE7\xE3o elei\xE7\xF5es elej\xE9n elektrik elektrische elektrisk elektron elektronik element elemental elementary elemente elementen elementi elemento elementos elements elementu elementy element\xF3w elenco eles eletto elettorale elettrica elev elevada elevado elevata elevated elevation elevato eleven elever elezioni elf elftal eli eligibility eligible eliminaci\xF3n eliminado eliminar eliminate eliminated elimination elite elitra elk elkaar elke ell ella ellas elle ellen elleni ellen\xE9re eller ellers elles ello ellos ells elmi elm\xFAlt eln\xF6ke elokuuta elokuva elokuvan elokuvassa els else elsewhere els\u0151 els\u0151sorban elu elv elva elven elwir el\xE4\xE4 el\xE9ctrica el\xE9ctrico el\xE9g el\u0151 el\u0151bb el\u0151sz\xF6r el\u0151tt email emaitzak emakume emakumeak eman emas ematen ema\xF1 embannet embargo embarked ember emberek emberi embora embouchure emerge emerged emergency emerging emigrated emir emisi\xF3n emissions emissora eml\xEDtik emotional empat empate emperador empereur emperor empezar empezaron empez\xF3 emphasis empieza empire emplacement emplea empleados empleo emploi employed employee employees employer employment employ\xE9 employ\xE9s empresa empresario empresas empreses empty emp\xEAcher emrin ena enable enabled enam encara encargado enceinte enciklopedija enciklopedij\u0173 encima encontra encontraba encontraban encontrada encontrado encontrados encontram encontrar encontraron encontro encontr\xF3 encore encounter encountered encourage encouraged encuentra encuentran encuentro encuentros encyclopedia end enda endangered endast endavant ende ended endemic enden ender endet endete endg\xFCltig endine ending endnu endorsed endret endroit ends endte end\xE8la end\xE9mica end\xE9mique ene enemies enemigo enemigos enemm\xE4n enemy eneo energi energia energie energii energije energy energ\xEDa enerji enero enerx\xEDa eneste enfance enfant enfants enfermedad enfermedades enfin enfoque enforcement enfrentar enfrent\xF3 eng engage engaged engagement engagiert engagierte engag\xE9 engelsch engelsk engelska engelske engem engenheiro enger engine engineer engineering engineers engines engl engleski englez\u0103 englisch englische englischen englischer enhanced eni enige enjoy enjoyed enkel enkele enkelt enkelte enlace enlarged enligt enlisted enn enne ennek ennemi ennemis ennen eno enorme enough enpresa enpresak enp\xF2tan enquanto enqu\xEAte enregistre enregistrement enregistr\xE9 enrolled enrollment ens ensayos enseigne enseignement ensemble ensembles ense\xF1anza ensi ensimm\xE4inen ensimm\xE4isen ensimm\xE4isen\xE4 ensimm\xE4ist\xE4 ensin ensino ensuite ensure ent entamu entanto entdeckt entdeckte ente enten entender entendre enter entered entering enterprise enterrado enters entertainment entferne entfernt entgegen enthalten enth\xE4lt entidad entidade entidades entier entinen entire entirely entitat entitats entiteten entities entitled entity enti\xE8re enti\xE8rement entlang entlassen entonces entorn entorno entote entra entrada entradas entrambe entrambi entrance entrando entrant entrar entrare entrata entra\xEEne entra\xEEnement entra\xEEneur entre entrega entrenador entrenamiento entrepreneur entreprise entreprises entrer entretien entrevista entrevistas entries entro entrou entry entr\xE9e entr\xF2 entr\xF3 entschied entschieden entsprechend entsprechende entsprechenden entspricht entspringt entstand entstanden entstehen entsteht entweder entwickeln entwickelt entwickelte entwickelten entziklopedia entziklopedikotik ent\xE1 ent\xE3o ent\xF3n ent\xF3s envers enviado enviar environ environment environmental environments environnement environs envi\xF3 envoie envoy\xE9 enw enwau enzim enzima enzyme en\xE4\xE4 epi epic episcopal episod episode episodes episodi episodio episodios epis\xF3dio epis\xF3dios epizoda epoca epocha epochae equal equality equally equation equations equilibrio equip equipaggio equipe equipes equipment equipo equipos equipped equips equipu equity equivalanta equivalent equivalente era erabili erabiltzen eraiki eraikuntza eraill erakusten eram eran erano erat erau erauzte erbaut erbaute erbyn erd\xE9lyi ere erected erede eredeti eredetileg eren erfolgen erfolgreich erfolgreiche erfolgreichen erfolgt erfolgte erfolgten erforderlich erf\xE4hrt erg ergeben ergibt erg\xE4nzt erhalten erhaltene erhaltenen erheblich erhielt erhielten erhoben erh\xE4lt erh\xE4ltlich erh\xF6ht eri erilaisia erinnert eriti eritt\xE4in erityisesti erkek erkend erkennbar erkennen erkl\xE4rt erkl\xE4rte erlangte erlaubt erlebte ermita ermittelt ermordet erm\xF6glichen erm\xF6glicht erm\u0259ni ernannt ernannte erne erneut erosi errang erre erreichen erreicht erreichte erreichten erresidentzia erretiraturik erreur errichten errichtet errichtete errichteten erroldako erroldaren erroldatutako error errors ers erscheinen erscheint erschien erschienen ersetzt erst erstattet erste erstellt ersten erster erstes erstmals erstreckt erthygl eru ervan ervoor erwarb erweitert erweiterte erworben erw\xE4hnt erzeugt erzielt erzielte erz\xE4hlt er\xF6ffnet er\xF6ffnete er\u0151s esa esan esas escala escapar escape escaped esce escena escenario escenas esclavos esclusivamente escola escolar escolas escoles escolha escontra escort escrever escreveu escribe escribir escribi\xF3 escriptor escrit escrita escritas escrito escritor escritora escritores escritos escritura escriure escudo escuela escuelas escultor escultura esculturas escut esdevenir ese esecuzione esempi esempio esemplari esercito esercizio esetben esett eset\xE9ben eset\xE9n esfera esfor\xE7os esfuerzo esfuerzos esgl\xE9sia esi esiintyi esiintyy esimees esimene esimerkiksi esimese esis esiste esistente esistenza esistono esitti eski eskola eskualdean eskubideen eskuragarri eso esordio esos espace espaces espacial espacio espacios espada espagnol espagnole espai espanhol espanh\xF2la espansione espanyol espanyola espa\xE7o espa\xF1ol espa\xF1ola espa\xF1olas espa\xF1oles especiais especial especiales especialista especializada especializado especially especialment especialmente especie especies especificamente espectadores espect\xE1culo espec\xEDfica espec\xEDfico espec\xEDficos espera esperanza esperar esperienza espiritual espoir espoirs esposa esposo espressione esprit esp\xE8ce esp\xE8ces esp\xE8cie esp\xE8cies esp\xE9cie esp\xE9cies esp\xEDritu esquema esquerda esquerra esquina essa essai essais essas essay essays esse essence essendo essent essential essentially essentiel essentiellement essere essersi esses essi esso est esta estaba estaban estable establece establecer establecido establecimiento estableci\xF3 establezimendu establiment establiments establir establish established establishing establishment estaciones estaci\xF3 estaci\xF3n estadio estado estados estadounidense estadounidenses estadual estadunidense estan estancia estando estar estas estasyon estat estatal estate estates estatistik estatistiken estats estatua estatuan estatubatuar estatus estauxunidense estava estavam estaven esta\xE7\xE3o esta\xE7\xF5es este estende estensione esterna esterno estero estes esteve esti estil estilo estilos estilu estima estimada estimate estimated estimates estime estim\xE9 estim\xE9es estiu estivo esti\xF3 esto estos estrada estrategia estratto estreia estrela estrelas estrella estrellas estrelles estrema estremamente estremit\xE0 estrenada estreno estren\xF3 estreou estructura estructuras estructures estrutura estruturas estudantes estudar estudi estudiant estudiante estudiantes estudiar estudio estudios estudiosos estudis estudiu estudi\xF3 estudo estudos estudou estul estuvieron estuvo est\xE0 est\xE1 est\xE1dio est\xE1n est\xE1ndar est\xE1u est\xE3o est\xE9n est\xE9tica est\xFAdio eta etablert etapa etapas etapes etappe etc etdi etdiyi etenkin etgan ethnic etiam etichetta etilgan etj etki etmek etmektedir etmi\u015F etmi\u015Fdir etmi\u015Ftir etm\u0259k etm\u0259y\u0259 etnia etnic\u0103 etnik etre ett ette ettei etter ettersom etti etti\u011Fi ett\xE4 etwa etwas etxeak etxebizitza etxek etxetan et\xE0 euklidsku euren euro europea europeas europee europei europeiske europeo europeos europeu europeus europ\xE4ische europ\xE4ischen europ\xE9en europ\xE9enne europ\xE9ennes europ\xE9ens euros eur\xF3pai eus euskal eut eux eva evaluation evangelisch evangelische evangelischen evante evel even eveneens evening event eventi evento eventos events eventual eventually eventualmente ever every everyone everything evi evidence evidencia evidenciju evident evidente evil evit evitar evitare evo evolucionat evoluci\xF3n evolution evolutionary evoluzione evolved exact exactly examen examination examined example examples excelente excellence excellent excentricidade excentricitate excentricit\xE9 excepci\xF3n except exception exceptions excepto excess excessive exchange excluding exclusiva exclusivamente exclusive exclusively exclusivement executed execution executive exempel exempelvis exemplaires exemplar exemplaren exemplares exemple exemples exemplo exemplos exemplu exerce exercer exercice exercise exhaustif exhibit exhibited exhibition exhibitions exhibits exige exil exile exilio exist existe existed existem existen existence existencia existent existente existentes existieren existiert existing existir exists existuje exist\xE2nd exist\xE8ncia exist\xEAncia exist\u0103 exit expand expanded expanding expansion expansi\xF3n expans\xE3o expected expedici\xF3n expedition expelled expensive experience experienced experiences experiencia experiment experimental experiments experi\xEAncia expert expertise experts explain explained explains explanation explica explicar explique exploitation exploration explore explored explorer explosion explotacions explotaci\xF3n export expose exposed exposici\xF3n exposition expositions exposi\xE7\xE3o exposure expresi\xF3n express expressed expression expressions express\xE3o exp\xE9dition exp\xE9rience exp\xE9riences extant extend extended extending extends extensa extension extensions extensive extensively extensi\xF3n extens\xE3o extent exterior externa external externe extiende extinct extinction extinta extra extraction extrait extranjero extranjeros extraordinary extrapolation extrem extrema extreme extremely extremo extremos extr\xE9mit\xE9 extr\xEAme extr\xEAmement ext\xE9rieur ex\xE8rcit ex\xE9cutif ex\xE9cution ex\xE9rcito ex\xE9rcitu eyaletinde eye eyes eyni ezek ezeket ezen ezer ezt ezut\xE1n ezzel ez\xE9rt e\xF0a e\u011Fitim e\u0161te fabbrica fabricaci\xF3 fabricaci\xF3n fabricante fabrication fabrikazioko fac facade faccia facciata face faced facendo facente facer faces faceva fachada facile facilement facilitar facilitate facilities facility facilmente facing fact faction facto factor factores factories factors factory facts factsheet faculty facult\xE9 faer fahren fai faible fail failed failing failure fair faire fairly faisait faisant fait faite faites faith faits faixa faixas faj fajiry fakat fakt faktor fakultet fakulteta fala falar fall falleci\xF3 fallen falling falls falsa false falso falt falta falu fama fame famiglia famiglie familha famili familia familiak familian familiar familiaren familiares familiars familias familie familiei familien families familii familio familj familjen famille familles family famosa famoso famosos famous fam\xEDlia fam\xEDlias fam\xEDlies fam\xFCl fam\xFCla fam\xFClas fam\xFCls fan fand fanden fandt fanisana fann fanno fanns fans fant fantasma fantasy fanteria faoi fapt faptul far fare faren faritany faritr farkl\u0131 farm farmer farmers farming farms fars farsi farw fascia fascista fase fases fashion fasi fast faste faster fastest fat fatal fate father fato fatta fatti fatto fault fauna faune faut faux faveur favor favorable favorables favore favorite favour favourite faz faza fazem fazendo fazer fazia fazie fazla fa\xE7ade fa\xE7ana fa\xE7on fa\u021Ba fa\u021B\u0103 fear feat feature featured features featuring febbraio febreiro febrer febrero febreru februar februari februarie febru\xE1r febru\u0101r\u012B fece fecero fecha fechas fechu fed fedal\xE4n fede federal federale fedezte fee feed feedback feeding feel feeling feelings feels fees feet fehiben feh\xE9r feia feierte feira feit feita feitas feito feitos fekete fekk fekszik fekv\u0151 fel feles\xE9ge feles\xE9g\xFCl felett feliz fell felles fellow fels\u0151 felt fel\xE9 fem female females femelle femelles femenina femenino feminino feminist femme femmes femmine femminile femte fenn fenomen fenomeno fent fen\xEAtres fen\xF3meno fer fera ferched ferdig ferme ferro ferrocarril ferrovia ferroviaire ferroviaria ferroviario ferry ferskate fertiggestellt fertile fest festa feste festgelegt festival festivals festivalu fet fets feu feudal feudo feuilles fever fevereiro fevral fevrye few fewer fewn fez fia fianco fiatal fiber fibra fibre fica ficando ficar ficci\xF3n fiche fick ficou fiction fictional fie fiecare fief fiel field fields fielen fiesta fiestas fifteen fifth fifty fight fighter fighters fighting fights figli figlia figlio figs figur figura figuras figure figuren figures figuur fiind fik fikk fil fila filas file filed filem files filha filho filhos filial filiale fill filla fille filled filles fillo filloi fills film filma filmas filmben filme filmed filmen filmer filmes filmet filmi filmie filmin filming filmova filmowy films filmski filmu filmy film\xF3w filo filosof filosofi filosofia filosofie filosofo filosof\xEDa filozof filozofii fils filter filum fil\xF3sofo fim fin fina finado finais final finala finale finalement finalen finales finali finalist finalista finalizar finaliz\xF3 finally finalment finalmente finals finance finances financial financier financi\xE8re financi\xEBle finantziazio finanziellen fina\u0142u finch\xE9 find finde finden findes findet finding findings finds fine fines finestra finestres finger fini finish finished finishing finit finite finn finne finner finnes finns fino fins finsk finst fin\xE1le fin\xEC fiori fir fire fired fires firing firm firma firme firms firmy firm\xF3 fironany first fiscal fiscals fiscaux fish fishes fishing fisiana fisica fisico fisk fiskal fiskalaren fiskart fit fitness fitted fitxa fiul fiume five fivondronan fixe fixed fixo fizar\xE0na fizeram fizik fizika fi\xFA fjell fjellet fjerde fjorden fj\xE4rilsart fj\xF6lda flag flagship flash flat fled fleet fleire fler flera flere flertal flest flesta fleste fleurs fleuve flew flexible flies flie\xDFt flight flights floating floden flood flooding floor floors flor flora flores flors flota flotta flotte flow flower flowering flowers flowing flows fluid flute fluvial flux fly flying flytta flyttade flyttede flyttet fl\xF6dar foar foarte foc focal focus focused focuses focusing fod fodboldspiller fog foglie fogo fogu\xE8ron fogu\xE8t foi fois fokus folgen folgende folgenden folgt folgte folgten folk folket folklore folle follow followed followers following follows folosit folyamatosan foly\xF3 fon fonction fonctionnement fonctions fond fonda fondamentale fondata fondateur fondateurs fondation fondato fondatore fondazione fonde fondi fondo fondos fonds fondu fond\xE9 fond\xE9e fons font fonte fontes fonti fontos fonts food foods foot footage football footballer footballeur for fora foram foran forbindelse force forced forces forcing ford fordelt forderte fordi ford\xEDt\xE1s\xE1n foreign foren forest forests forfatter forhold forlag form forma formaci\xF3 formaci\xF3n formada formado formal formally formalmente forman formand formando formann formant formar formare formaron formas format formata formation formations formato formats format\u0103 formazione forma\xE7\xE3o forme formed formen forment former formerly formes formie forming formou forms formula formule formy form\xE5l form\xE9 form\xE9e form\xF3 form\u0103 foron forse forskellige forskjellige forskning fors\xF8k fort forta fortaleza fortan forte fortement fortemente forteresse fortes fortfarande forth forti fortifications fortress forts fortsatt fortsatte fortuna fortune forty forum forward forza forze for\xE7a for\xE7as for\xEAt for\xEAts fos fosil fosse fossero fossil fossils fost fotbal fotball fotballspiller fotbalov\xFD foto fotograf fotografi fotografia fotografie fotograf\xEDa fotos fou fought fouilles found foundation foundations founded founder founders founding four fournir fourteen fourth fowk fra frac fraction frae fragment fragmentos fragments frais fram frame frames framework framf\xF6r framr\xE4knad franc francesa francesas francese franceses francesi francesos francez franceze francez\u0103 franchise francia franco francoski francouzsk\xFD francs francuski franc\xE8s franc\xE9s franc\xEAs franc\xFAzska franc\xFAzsky fransk franska franske frans\xE9isch frans\xE9s frantsesez franz\xF6sisch franz\xF6sische franz\xF6sischen franz\xF6sischer fran\xE7ais fran\xE7aise fran\xE7aises frase frases fratelli fratello frattempo fraud frazione frecuencia frecuente frecuentemente frecuentes fred free freedom freestyle freguesia frei freie freien freier freight freisin frem frente frequency frequent frequentemente frequently frequenza fresco fresh freshwater fri friend friendly friends friendship friidrett froid from front frontal fronte fronteira frontera fronti\xE8re fronti\xE8res fruit fruits fruto frutos frutto fr\xE1 fr\xE4mst fr\xE5 fr\xE5n fr\xE8re fr\xE8res fr\xE9quemment fr\xE9quence fr\xEDo fr\xFCh fr\xFChen fr\xFCher fr\xFChere fr\xFCheren fshat fue fuego fuel fuente fuentes fuera fuerces fueron fuerte fuertemente fuertes fuerza fuerzas fuga fuggire fugir fuhr fuit fuktigt fulgte full fully fun funciona funcional funcionamiento funcionar funcionarios funciones funcions funci\xF3 funci\xF3n functie function functional functions func\u021Bia func\u021Bie fund funda fundaci\xF3n fundada fundado fundador fundadores fundamental fundamentalmente fundar funda\xE7\xE3o funded fundet funding fundit fundo fundou funds fund\xF3 funeral fungi fungierte fungsi funk funkce funkci funkcija funkcije funkcje funkcji funkcj\u0119 funnet funzione funzioni fun\xE7\xE3o fun\xE7\xF5es fuoco fuori fur furent furniture furono further fuselage fusion fusione fusi\xF3n fusta fut futbol futbola futbolcudur futbolista futbolo futebol futebolista futur futura future futuro fwyaf fylke fyra fyrir fyrst fyrsta fyrste fzs f\xE1brica f\xE1cil f\xE1cilmente f\xE1il f\xE3s f\xE4llt f\xE5et f\xE5r f\xE5tt f\xE9d\xE9ral f\xE9d\xE9rale f\xE9d\xE9ration f\xE9idir f\xE9in f\xE9l f\xE9le f\xE9minin f\xE9minine f\xE9rfi f\xE9vrier f\xEAte f\xEAtes f\xEDa f\xEDos f\xEDsica f\xEDsico f\xEDsicos f\xEDu f\xF2r\xE7a f\xF3r f\xF3rmula f\xF6dd f\xF6ddes f\xF6ljande f\xF6r f\xF6rbundslandet f\xF6re f\xF6rekommer f\xF6rekomst f\xF6rfattare f\xF6rsamling f\xF6rst f\xF6rsta f\xF8dd f\xF8dt f\xF8lge f\xF8lgende f\xF8lger f\xF8r f\xF8re f\xF8rer f\xF8rst f\xF8rste f\xF8rt f\xF8rte f\xFAtbol f\xFCggetlen f\xFChren f\xFChrenden f\xFChrt f\xFChrte f\xFChrten f\xFCnf f\xFCnften f\xFCr f\u0103cut f\u0103r\u0103 f\u0151k\xE9nt f\u0151leg f\u0259aliyy\u0259t f\u0259sil\u0259sinin gaan gaat gab gabe gabeko gaben gabinete gacha gada gadam gadang gade gadhah gados gadsimta gadu gad\u0101 gael gaf gagal gagne gagner gagn\xE9 gai gain gained gaining gains gaireb\xE9 gal gala galaksidir galaksija galaktika galaktikadir galaxia galega galego galerie gali galima gall galleg gallery gallo galt gama gamay gambar game gameplay games gamla gamle gamma gammal gamme gammel gampong gan gana ganader\xEDa ganado ganador ganando ganar ganet gang gange gangen ganger ganhar ganhou ganska ganske gant ganta\xF1 ganz ganze ganzen gan\xF3 gap gar gara garage garantir garde garden gardens gardien gare garis garnison garraio garrison gar\xE7on gas gases gastos gastropod gate gates gathered gathering gatunek gatunki gatunku gatunk\xF3w gauche gauge gaur gav gave gavo gavs gay gaya gaz gazdas\xE1gi gde gdje gdy gdy\u017C gdzie gear geb gebaseerd gebaut geben gebied gebieden gebildet gebleven geblieben gebore geboren geborene gebou gebouw gebouwd gebouwen gebracht gebruik gebruiken gebruikt gebruikte gebuer gedaan gedeelte gedeeltelijk gedreht gedung gedurende ged\xE9na geeft geeignet geen gefangen gefertigt gefunden gef\xE4rbt gef\xF6rdert gef\xFChrt gegeben gegen gegen\xFCber gegeven gegevens gegn gegr\xFCndet gegr\xFCndete gegr\xFCndeten gegu\u017E\u0117s gehad gehalten geheel gehele gehen gehiago gehouden geht geh\xF6ren geh\xF6rt geh\xF6rte geh\xF6rten geiht gekomen gekommen gekozen gel gela gelang gelangen gelangte gelar geld geldi geldig geldi\u011Fi geldt gelegen gelegene gelegenen gelegentlich gelegt geleitet gelen gelenek gele\xEB gelijk gelijknamige gelingt gelir gelombang gelten gemaak gemaakt gemacht gemeente gemeenten gemeinsam gemeinsame gemeinsamen gemiddelde gem\xE4\xDF gen genaamd genannt genannte genannten genau gender gene genel genellikle gener genera generaal generaci\xF3n general generala generale generales generali generally generalment generalmente generalnej generals generar generasi generate generated generation generations generator generazione genera\u0142 genera\u0142a genere generelt generi generic generoko genes genetic geni genitori geni\u015F gennaio gennem genoeg genoem genoemd genom genome genomen genommen genomsnitt genomsnittlig genre genres gens gent genta\xF1 gente genul genus genutzt genyen genyn gen\xE7 gen\xE9rico geografiartikkelen geographic geographical geogr\xE1fica geometria geometry geonames geopend georganiseerd geplaatst geplant geplanten geproduceerd gepr\xE4gt gepr\xFCft gepubliceerd gepubliseer ger geraadpleegd gerade gerakan geral geralmente gera\xE7\xE3o gereja gerekend geri geriet gering geringe geringen geringer german germana germans german\u0103 germ\xE0 gerne gero gertuen ger\xE7ek gesamte gesamten geschaffen geschat geschiedenis geschlagen geschlossen geschreven geschrieben gesehen gesetzt geslacht gesloten gespeeld gespielt gesprochen gesproken gestaltet gesteld gestellt gesticht gestig gestion gestione gesti\xF3n gestorben gestuerwen gest\xE3o get getal getragen getrennt getroffen getrouwd gets getting get\xF6tet geus geval gevallen geven gevestigd gevolg gevolgd gevonden gevormd gewann gewannen geweest geweiht gewesen gewinnen gewone gewonnen gewoonlik geword geworden gew\xE4hlt gezeigt gezet gezien gezin gezogen gezwungen gez\xE4hlt ge\xE4ndert ge\xE7en ge\xE7ti ghi ghiaccio ghost gia giai giallo gian giant giao giapponese giapponesi giardino gibi gibt gick gie gifft gift gifte giftet gigante gihabogon gihulagway giiniton gik gikan gikk gilapdon gilay gilt gimnazjum ginbahin ginee ging gingen ginhatag ginhulagway ginn gioca giocare giocato giocatore giocatori giochi gioco gioc\xF2 giornale giornalista giornata giorni giorno giovane giovani giovanile giovanili gir gira girato girdi giri girl girlfriend girls giro girone gironi gisa gitaar gitar gitara gitarist gitarr gitas gitt git\xE1r giudice giugno giunse giustizia give given giver gives giving gizon gizonak gi\xE0 gi\xE0nh gi\xE1 gi\xE1c gi\xE1m gi\xE1o gi\xE1p gi\xF3 gi\xFAp gi\u1EA3 gi\u1EA3i gi\u1EA3m gi\u1EA3n gi\u1EA3ng gi\u1EA5y gi\u1EBFt gi\u1ED1ng gi\u1EDBi gi\u1EDD gi\u1EEF gi\u1EEFa gjat\xEB gjekk gjeld gjennom gjere gjerne gjeve gjin gjitha gjithashtu gjith\xEB gjorde gjort gj\xF8r gj\xF8re gks glace glas glass glavna glavne glavni glavnih glavnog glede gleich gleiche gleichen gleichnamigen gleichzeitig gles glesbefolkat gli global globale globalt globe gloria glumac glumica gmin gmina gminie gminy gmin\u0119 goal goalkeeper goals gobernador goberno gobierno gobiernos gobiernu god gode godina godine godini godinu gods godt goed goede goes gogledd going gol gola gold golden goles golf golfo goli golongan golpe gols gone gong good goods google gora gospel got gothique gotovo goud goude gouden gouf goufen gouvernement gouverneur gov govern governador governance governatore governed governing government governmental governments governo governor govori go\xFBt go\u015Bcinnie gra graaf graafschap grabaciones grabaci\xF3n grabado grabar grab\xF3 gracias gracilis grad grada grade grader grades gradi grado grados gradova gradovi gradu gradual gradually gradualmente graduate graduated graduates graduating graduation gradu\xF3 graet graf grafik grafikoan grain graj\u0105cy gram grammar gran grana grand granda grande grandes grandeso grandfather grandi grandmother grands grandson granica granicach granice granicy granite grans grant granted grants graph graphic graphics gras grass gratis gratu\xEFt grau graus gravado gravadora gravar grava\xE7\xE3o grave gravemente graven graves gravi gravity gray grazie gra\u0142 great greater greatest greatly grec greca greco grecque grecs green grega grego grein grens grenser grenst grenzt gresk greske greu greve grevskapet grew grey grid griechisch griechischen griega griego griegos gris groei groeide groep groepen gromad gromada gromady grond groot grootste grootte gros gross grosse grosso grote grotendeels groter grotere grotte grottor ground grounds group groupe groupes groups grow growing grown grows growth gro\xDF gro\xDFe gro\xDFen gro\xDFer gro\xDFes grubu grudnia grudniu grund grundades grundlagt grunds\xE4tzlich grunn grunnlagt gruod\u017Eio grup grupa grupas grupe grupi grupie grupo grupos grupp gruppa gruppe gruppen grupper gruppi gruppo grups grupu grupy grup\u0117 grup\u0117s grup\u0119 grut grutste grutte gry grze gr\xE0cies gr\xE0fic gr\xE1fico gr\xE2ce gr\xE4nsen gr\xE4smarker gr\xF3f gr\xF6\xDFer gr\xF6\xDFere gr\xF6\xDFeren gr\xF6\xDFte gr\xF6\xDFten gr\xF6\xDFtenteils gr\xFCndete gr\xFCndeten gr\xFCnnt guanyar guard guarda guardia guards gud guerra guerras guerre guerres guerrilla guest guests guida guidance guide guided guides guilty guion guionista guitar guitare guitarist guitariste guitarra guitarrista guitars gul gula guld gull gumun gun guns gunung gur guraso guru gusht gustina gustini gusto gut gute guten guvernementet guztiak guztietako gwahanol gwaith gwo gwrywaidd gwyddonol gyakran gyda gyfer gyfrol gymnasium gynhyrchwyd gynnwys gyvena gyveno gyventojai gyventoj\u0173 gyvenviet\u0117 gy\u0151ztes g\xE1i g\xE2y g\xE4llande g\xE4ller g\xE5ng g\xE5ngen g\xE5nger g\xE5r g\xE5rd g\xE5rden g\xE5tt g\xE8nere g\xE9nero g\xE9neros g\xE9nie g\xE9n\xE9ral g\xE9n\xE9rale g\xE9n\xE9ralement g\xE9n\xE9ration g\xE9n\xE9raux g\xE9ographique g\xEAnero g\xEAr g\xEBtt g\xF3l g\xF3lt g\xF3p g\xF3ry g\xF3tico g\xF6r g\xF6ra g\xF6re g\xF6rev g\xF6r\xF6g g\xF6r\u0259 g\xF6st\u0259rir g\xF6\xE7 g\xF8r g\xF8re g\xFCn g\xFCn\xFC g\xFCn\xFCm\xFCzde g\xFC\xE7l\xFC g\u0119sto\u015B\u0107 g\u0142os\xF3w g\u0142\xF3wnego g\u0142\xF3wnej g\u0142\xF3wnie g\u0142\xF3wny g\u0142\xF3wnych g\u0142\xF3wnym g\u0259lir g\u0259l\u0259n g\u1EA7n g\u1EAFn g\u1EAFng g\u1EB7p g\u1ECDi g\u1ED1c g\u1ED3m g\u1EEDi haalde haar haavon hab habagatan habagatang habakabaka habe habebat haben haber habiendo habilidad habilidades habita habitaci\xF3n habitant habitantaro habitantes habitanti habitants habitat habitatge habitatges habitatnyo habitats habitesis habitis habitual habitualmente habla hablar habr\xEDa hab\xEDa hab\xEDan hac hace hacen hacer hacerlo hacerse hacia haciendo hac\xEDa had hadde hadden hade hadi hadsereg hadton hae haed haes hafa hafi haft hafta haf\xF0i hag hagyom\xE1nyos hai hain hainbat hair haiwan hak hakeliny hakim hakkas hakk\u0131nda hal hala halaman halavam halda halde hale halen half hali haline halk hall hallituksen halt halten halve halv\xF6ar hal\xE1la ham hamaizin hamar hamda hameau hamlet hampir han hanc hand handball handed handel handelt handelte handen handia handlar handle handled handler handling hands hanem hang hanggang hann hanno hans hanya happen happened happens happy haqida haqq\u0131nda har harbour hard hardcore hardware hareket haren harga hari harm harmadik harr harren harrn hart hartu hartzen harus has hasa hasi hasil hasonl\xF3 hasonl\xF3an hasta haszn\xE1lj\xE1k haszn\xE1lt haszn\xE1lt\xE1k hat hata hatalmas hati hatramin hatt hatte hatten hat\xE1ros hat\xE1s\xE1ra hau hauek hauekin haupts\xE4chlich haur hauria haut haute hautes hauteur hava havas havde have haven haver havet havia haviam havien having havis hawwe hay haya hayvanc\u0131l\u0131\u011Fa hazai hazkundea haz\u0131rda head headed heading headquartered headquarters heads health healthy hear heard hearing heart heat heavily heavy heb hebben hebbt hecha hecho hechos hectare hectares hect\xE0rees hect\xE1reas hed heden hee heeft heel heen heer heet hefur hefyd hegy heid\xE4n height heile heilige heiligen heilt hein\xE4kuuta heir heiratete heit hei\xDFt hektar hektarea hel hela held hele helft helicopter helikopter hell heller helmikuuta help helped helping helps helst helt hely helyen helyet helyett helyi hely\xE9n hem hemanari hemanaro hemen hemiboreal hemiboreala hemijsku hen hence hende hendes henhold henholdsvis hennar henne hennes henta hep her heraus herausgegeben herb herbu herceg here herec here\u010Dka hergestellt herhangi heritage hermana hermano hermanos hero heroes herri herriak herriekin herself hertog hertug herunder hervez hervor her\xEB hesab hess hestoria het heter heti hett hetzelfde heure heures heute heutige heutigen hewan hezkuntzako he\xE7 hicieron hidden hide hidodikodonany hidrogen hiduik hidup hie hield hielo hielt hieman hien hienn hier hierarchy hierbei hierbij hierdie hierf\xFCr hierro hiervan hiervoor hie\xDF high higher highest highly highway higiezinen hii hij hija hijau hiji hijo hijos hil hilabihan hilang hiljada hiljade hiljem hill hills him himatan himself hin hinanden hinaus hindi hingegen hingga hini hinn hinten hinter hinzu hip hip\xF3tesis hir hire hired hiri hiria hiru his hispano hispanos hiss\u0259si histoire histoires historia historiador historiadores historial historian historians historias historic historical historically historie historien historiens historii historik historique historiques historisch historische historischen historisk historiske history historyk hist\xF2ria hist\xF3ria hist\xF3rias hist\xF3rica hist\xF3ricas hist\xF3rico hist\xF3ricos hiszen hit hita hitam hits hitting hivatalos hiver hivern hivyo hiyo hizkuntza hizmet hizo hiztegi hi\xE7 hi\xE7bir hi\u1EC3m hi\u1EC3u hi\u1EC7n hi\u1EC7p hi\u1EC7u hja hjelp hjelpe hjem hj\xE1 hj\xE4lp hj\xE6lp hlavne hlavn\xED hlavn\xEDho hlavn\xEDm hlavn\u011B hlm hnut\xED hoa hoang hoazh hoc hoch hockey hod hodie hodin hoe hoewel hof hogar hoge hoger hogere hogy hohe hohen hoher hojas hoje hokeja hol hold holde holder holding holds holdt hole holes holiday holl holotype holte holy hom hombre hombres home homem homenagem homenaje homens homes hometown homi hommage homme hommes homo homosexual hom\xF3nima hon honako honek honen honetan hongrois honlapja honneur honom honor honorary honored honoris honors honour honours honra honum hoofd hoofdstad hoog hoogleraar hoogste hoogte hop hope hopeaa hoped hopes hora horas horen hores hori horiek horien horisonten horizontal hormone horn horren horretan horror hors horse horses horv\xE1t hory hos hosil hospital hospitals hossz\xFA host hostatgeria hosted hostile hosting hosts hot hotel hotels hou houden houdt hour hours house housed household householder households houses housing houten houve hovedsakelig hovedstad hovedstaden how however hoxe hoy hozott hozz\xE1 ho\xE0n ho\xE0ng ho\xE1 ho\u1EA1ch ho\u1EA1t ho\u1EB7c hra hrabstwie hrad hradu hraje hrane hranice hranici hrvatska hrvatske hrvatski hrvatskih hrvatskog hry hr\xE1ch hr\xE1l hr\xE1\u010D htm html http https hub hubiera hubo hubungan hudby hudebn\xED huet huge huhtikuuta hui huidige huile huis huit huiti\xE8me hujan huko hukum hul hulka hull hulle hulp humain humaine humaines humains human humana humanas humanity humano humanos humans humo humor humour hun hundert hundred hundreds hung hunn hunting huolimatta hur hurricane hurtigt huruf hus husband huset hustru hutan hutsik huu huvudavrinningsomr\xE5de huvudsak huvudsakligen huvudstaden huwelijk huy huy\u1EC7n hu\u1EA5n hva hvad hver hverandre hvert hvilken hvilket hvis hvor hvordan hwn hybrid hyd hydrogen hyn hynny hypothesis hypoth\xE8se hyvin h\xE0i h\xE0m h\xE0ng h\xE0nh h\xE1bitat h\xE1bor\xFA h\xE1rom h\xE1t h\xE1z h\xE3ng h\xE4lt h\xE4n h\xE4nelle h\xE4nell\xE4 h\xE4nen h\xE4nest\xE4 h\xE4net h\xE4ngt h\xE4nt\xE4 h\xE4r h\xE4rad h\xE4tte h\xE4tten h\xE4ufig h\xE4visi h\xE5r h\xE6r h\xE6ren h\xE9ritier h\xE9ros h\xE9t h\xECnh h\xEDres h\xF2a h\xF3a h\xF4m h\xF4n h\xF4pital h\xF4tel h\xF6chste h\xF6chsten h\xF6g h\xF6gre h\xF6gst h\xF6gsta h\xF6her h\xF6here h\xF6heren h\xF6jd h\xF6jddata h\xF6jdkurva h\xF6jduppgifter h\xF6r h\xF6ren h\xF6\xF6rt h\xF8j h\xF8rer h\xF8y h\xF8yere h\xF8yeste h\xF9ng h\xFAn h\xFAt h\u01A1i h\u01A1n h\u01B0\u01A1ng h\u01B0\u1EDBng h\u01B0\u1EDFng h\u0259m h\u0259min h\u0259m\xE7inin h\u0259r h\u0259rbi h\u0259yat h\u0259yata h\u1EA1i h\u1EA1m h\u1EA1n h\u1EA1ng h\u1EA1t h\u1EA3i h\u1EA5p h\u1EA7u h\u1EADu h\u1EBFt h\u1ECDa h\u1ECDc h\u1ECDp h\u1ECFi h\u1ED3i h\u1ED3ng h\u1ED9i h\u1EE3p h\u1EE7y h\u1EEFu iad iaith iaitu iako ialah iam ianao ianuarie iar iba ibabaw ibang ibar\u0259t ibar\u0259tdir ibi ibilgailu ibilgailuen ibland ibn iborat ibu ibukota ibunya ice ich ici ictimai ida idade idadi idag idar\u0259 idatzi iddia iddo ide idea ideal ideale ideas idee idees ideia ideig ideiglenes ideje idej\xE9n identical identidad identidade identifica identificar identification identified identify identity identit\xE0 identit\xE9 ideologia idet idi idioma idiomas idir ido id\xE9e id\xE9es id\u0151 id\u0151ben ieder iedz\u012Bvot\u0101ju ieguva iela iemand ien iets ieu ifade if\xF8lge iga igeltseroak igen igennem igitur igjen iglesia iglesias igra igrah igrao igra\u010D igra\u010Da igre igreja igrexa igrzysk igrzyskach igual igualmente ihm ihmisen ihn ihnen ihr ihre ihrem ihren ihrer ihres iii ika ikan ikasten iken iki ikinci ikke ikki ikkje iklim iklimi iko iku ikut ilan ilang ilay ild\u0259 ild\u0259n ile ilegal ilesia ilgili ilgio ilha ilhas ili ilikuwa ilin iline ilinin iliyofanyika ilk ilk\xF6\u011Fretim ill illa illas illegal illes illetve illik illness illustrated illustration illustrations illustre ill\u0259r ill\u0259rd\u0259 ilma ilman ilmestyi ilmiah ilmiy ilmoitti ilmu ilmus ilo\u015Bci ils ilyen il\xE7esine il\u0259 ima image imagem imagen imagens images imaging imajo imaju imala imali imalo imam imao imatge imatges imati imaxe imaxes imdb ime imehesabiwa imel imela imena imenom imenovan imenuje imidlertid imi\u0119 immagine immagini immediatamente immediate immediately immense immer immigrant immigrants immigration immune imm\xE9diatement impact impacto impedir imperador imperatore imperial imperiale imperijos imperio impero impianto impiegato impiego implement implementation implemented implica implications implijet import importance importancia important importanta importante importantes importanti importants importanza importe imported import\xE0ncia import\xE2ncia impose imposed imposible imposita impossible imprenditore imprensa impresa impressed impression impressive imprisoned imprisonment improve improved improvement improvements improving impuestos impulso imp\xE9riale im\xE1chens im\xE1genes ina inactius inactives inaktibo inaktiboak inaktiboetatik inaugurada inaugurado inaugural inaugurated inauguration inaugur\xE9 inayozungumzwa incarico incendie incendio inch inches incident incidente incidents inclinaison inclinata inclina\xE7\xE3o incloent inclosa inclou inclouen include included includes including incluem inclui incluida incluido incluindo incluir inclus incluse inclusion inclusiv inclusive incluso incluye incluyen incluyendo incluy\xF3 inclu\xEDa incolarum income incompleta inconnu incontra incontri incontro incorpora incorporar incorporated incorporates increase increased increases increasing increasingly incremento incumbent ind indak indbyggere inde indeed indeholder indeling indem inden independence independencia independent independente independently independiente independientes independ\xE8ncia independ\xEAncia index india indiano indica indicado indican indicar indicare indicate indicated indicates indicating indication indicato indice indie indien indigenous indijeni indios indipendente indipendenza indique individu individual individuale individuales individuals individuelle individuo individuos individus indiv\xEDduos indo indoor indray indre indrindra indtil induced inducted indult industri industria industrial industriale industrialen industrials industrie industriel industrielle industries industry ind\xE9pendance ind\xE9pendant ind\xE9pendante ind\xEDgena ind\xEDgenas ind\xFAstria infancia infant infanterie infanter\xEDa infantil infantry infanzia infatti infection inferior inferiore inferiores infine inflation influence influenced influences influencia influencias influential influenza influ\xE8ncia influ\xEAncia info infolge informa informace informaci\xF3 informaci\xF3n informacji informal informality informasi informasjon informatie information informations informatique informazio informazioa informazioni informa\xE7\xE3o informa\xE7\xF5es informe informed informes infraestructura infrastructure infrastructuur inf\xE9rieur inf\xE9rieure inf\xF6r ing inga ingegnere ingen ingeniero inggih ingick ingin ingkang inglesa inglese ingleses inglesi inglise ingl\xE9s ingl\xEAs ingreso ingresos ingresso ingressos ingres\xF3 inguruan inguruko ing\xE5r ing\xE9nieur inhabitants inhabited inherited ini inici inicia iniciada iniciado inicial inicialmente iniciar iniciativa inicio inicios iniciou inici\xF3 inicjatywy inimese inimest init initial initialement initially initiated initiative initiatives inizi inizia iniziale inizialmente iniziarono iniziativa iniziato inizio inizi\xF2 ini\u021Bial injection injeniera injured injuries injury inki\u015Faf inkludert inklusive ink\xE1bb inland inligting inmediatamente inmiddels inmigrantes inn innan innbyggere innbyggjarar inne innebar inneb\xE4r inneheld inneholder inneh\xE5ller innen innenfor inner inneren innerhalb innhald inni inning innings innovation innovative inntil innych innymi inoltre inom input ins insan insanlar insanlar\u0131n insbesondere inscription inscriptions inscrit inscrits insect insectes insectos insects insee insegnante insekter insektsart inserito insgesamt inside insieme insisted insj\xF6ar inspecteur inspection inspector inspirada inspirado inspiration inspire inspired inspir\xE9 instal instalaciones instalaci\xF3n installation installations installe installed installer install\xE9 instance instances instant instar instead insting instituciones instituci\xF3n institui\xE7\xE3o institui\xE7\xF5es institut instituta institutas institute instituti institution institutions instituto instruction instructions instructor instrueret instrukt\xF8r instrument instrumental instrumento instrumentos instruments instrumenty insula insulani insurance int intact intae inte integra integraci\xF3n integrada integrado integral integrante integrantes integrar integrated integration integraven integriert intel intelectual intellectual intelligence intelligent intenci\xF3n intended intensa intense intensity intensiv intensive intenso intent intenta intentar intention intentions intento intentos intent\xF3 inter intera interaction interactions interactive interamente intercambio interchange interdit interes interesante intereses interessant interessante interesse interest interested interesting interests interface interference interim interior intermedia intermediate interm\xE9diaire interm\xE9diaires intern interna internacionais internacional internacionales internal internasional internasjonale internationaal international internationale internationalen internationales internationally internationaux internationella internazionale internazionali interne internes internet interni interno internos intero interpolation interpreta interpretaci\xF3n interpretada interpretado interpretando interpretar interpretata interpretation interpretato interpretazione interpreted interpret\xF3 interpr\xE8te interpr\xE9tation interpr\xE9t\xE9 interretialis intersection interval intervenci\xF3n intervenir intervention intervento intervient interview interviewed interviews intervista inter\xE8s inter\xE9s intitolata intitolato intitulado intitul\xE9 intitul\xE9e into intorno intra intrat introdotto introducci\xF3n introduce introduced introducing introduction introduit introduzione int\xE8gre int\xE9gral int\xE9gr\xE9 int\xE9rieur int\xE9r\xEAt int\xE9r\xEAts invasion invasione invasi\xF3n invece invented invention inventor inverno inverse inversi\xF3n invertebrates investigaciones investigaci\xF3n investigador investigadores investigar investigate investigated investigation investigations investment investors inviato invierno invisible invitado invitation invited invit\xE9 invloed involve involved involvement involves involving inv\xE5nare inwoners inwonertal inyo inzibati inzwischen in\xE5t in\xE7 in\xE9 in\xEDcio in\xFDch in\u015Fa ion ions ipak ipar ipinaganak ipotesi iqtisadi ira irabazi ireo irga iri iria iris irlandese irm\xE3 irm\xE3o irm\xE3os irodalmi irodalom iron irregular irrigation ir\xE1 isa isam isan isang ise ish ishin ishlab ishte isimli iskola isla islam island islands islas isle\xF1os islla islles ismert ismi ism\xE9t isn iso isola isolated isolation isole ispirato ispod isso issu issue issued issues issus ist ista istana iste istehsal isti istifad\u0259 istilah istiqam\u0259tind\u0259 istiqomat istitussional istituto istituzione istnieje isto istoku istom istoria istoric istorice istorijos istra\u017Eivanja istri ist\xE4llet is\xE4 is\xE4ns\xE4 is\xE6r is\u0259 italian italiana italiane italiani italiano italianos italien italienische italienischen italienischer italienne italiensk italienske italijanski itali\xE0 itandi itd item items ither itibaren itibar\u0131yla ito its itse itself itt itu iturginak ity iulie iunie iussu iuw ivez iwwer iyi iyul iyun iza izabran izan izango izany izaten izay izd izdanje izdava\u010D izen izena izendatu izeneko izgradnja izin izlases izmed izme\u0111u iznad iznosi iznosila izquierda izquierdo izraz izvan izvirno izvor izvora izy i\xE7erisinde i\xE7erisindedir i\xE7in i\xE7inde i\xE7me i\u015Ftirak jaanuar jaanuaril jaar jaarlijks jabatan jabeak jabearen jacas jadi jag jail jaitsia jak jako jalan jalkapalloilija jalur jam jamais jaman jan janar janari janeiro januar januara januari janu\xE1r janu\xE1ra janvier janv\u0101r\u012B jan\xEB jaoks jap japanische japanischen japansk japanske japonais japonaise japonesa japoneses japonica japon\xE9s japon\xEAs jap\xE1n jarahasiny jarak jardin jardins jarduera jard\xEDn jaren jarige jaringan jarri jasno jaso jatetxe jatkoi jaton jatuh jau jauh jaune javlja javnosti jawab jazyk jazyka jazz jde jeb jedan jede jedem jeden jeder jedes jedini jedinica jedinice jedinjenje jedin\xFD jedna jednak jedne jednego jednej jednim jedno jednocze\u015Bnie jednog jednoho jednoj jednom jednostek jednostka jednostki jednotka jednotky jednotliv\xE9 jednotliv\xFDch jednou jednu jednym jedn\xE1 jedn\xE9 jedn\xEDm jedn\u0105 jedoch jedynie jefe jeg jego jeho jeho\u017E jej jejich jejich\u017E jej\xED jej\xEDho jej\xEDm jej\xED\u017E jelas jelen jelenleg jelent jelenti jelent\xE9se jelent\u0151s jellemz\u0151 jen jeneng jener jenis jen\u017E jer jesieni\u0105 jest jeszcze jet jetzt jet\xEB jeu jeugd jeune jeunes jeunesse jeung jeux jeweiligen jeweils jewografik jezera jezero jezik jezika jeziku jeziora je\u015Bli je\u0161t\u011B je\u017E jie jier jierren jih jihu jika jild jim jin jina jinis jin\xE9 jin\xFDch jis jiwa ji\u017E ji\u017En\xED jmenov\xE1n jm\xE9nem jm\xE9no joan job jobb jobbet jobs joc jog joga jogador jogadores jogar jogo jogos jogou johdolla johon johtaa johtaja johti joiden joilla join joined joining joins joint jointly joissa joista joita joj joka joko jolla jolloin jong jonge jonka jooksul jopa jord jordbruksmark jorden jornada jornal jornalista jos joskus jossa josta jota joten jotka jotta jouant joue jouent jouer joueur joueurs joukkue joukkueen joukkueessa joulukuussa joulukuuta jour journal journalism journalist journaliste journalists journals journaux journey journ\xE9e jours joutui jou\xE9 jove jovem joven jovens joves joylashgan jo\u0161 jsem jsou juara juba jubilades jucat jude\u021Belor jude\u021Bul jude\u021Bului judge judges judgment judiciaire judicial judo judul jud\xEDos juega juego juegos juez jug juga jugador jugadores jugando jugar juge jugu jug\xF3 juicio juifs juillet juin juist juive jula julho juli julija julio juliol julkaisi julkaistiin julkaistu july jumlah jump jumping juna junction jung junge jungen jungle junho juni junija junio junior juniors junior\xF3w junta juntament juntamente junto juntos juny juo jur jure juridique jurisdiction jurist juru jurul jury jur\xEDdica jusqu jusque just juste justerad justice justicia justo juta jutott juu juuli juulil juuni juunil juurde juures juuri juvenil juventud ju\u017C ju\u017Eno j\xE1rt j\xE1r\xE1s j\xE1r\xE1sban j\xE1r\xE1s\xE1hoz j\xE1tszott j\xE1t\xE9k j\xE1t\xE9kos j\xE4hrige j\xE4hrigen j\xE4hrlich j\xE4i j\xE4lkeen j\xE4lleen j\xE4mf\xF6rt j\xE4rel j\xE4rgi j\xE4rjestettiin j\xE4rv j\xE4sen j\xE4\xE4b j\xE9n j\xF3l j\xF3venes j\xF5e j\xF6tt j\xFAla j\xFAlius j\xFAna j\xFAnius j\xFAn\xED j\xFCdische j\xFCdischen j\xFCngeren j\u0119zyk j\u0119zyka j\u0119zyku j\u016Blij\u0101 j\u016Bnij\u0101 j\u016Bras j\u016Bros kaam kaart kaarten kaasa kaayo kababarak kabanay kabel kabentuk kabi kabinet kabukiran kabul kabungtoran kabupaten kacamatan kacatet kad kada kadang kadar kadencji kadry kad\u0131n kahaboga kahdeksan kahden kahe kahenera kai kaikki kaikkien kaimas kaimo kainkintana kaip kaki kako kaks kaksi kala kalah kalan kalangan kalas kalawan kalba kalbos kaldes kaldet kald\u0131 kale kalender kali kalinya kaliyan kalla kallad kallade kallades kallar kallas kallaste kalles kallt kalt kam kama kamadan kamen kamera kami kamp kampanii kampe kampen kamper kampioen kampioenschap kampung kamu kan kana kanadischen kanak kanal kanalen kanaler kanalizasyon kanan kandidaat kandidat kang kanggo kangg\xE9 kanilang kann kans kanskje kanssa kant kanthi kanton kantonen kantonit kantor kantved kanyang kan\xEB kao kaodim kaominin kaominina kap kapal kapalo kapcsolatban kapel kapela kapely kaping kapital kapitan kaple kapott kappale kappaleen kappaletta kapta kaptein kapten kapunawpunawan kar kara karakter karar karasal karate karbon kardinal kardyna\u0142 kareh karena karier kariery karierze karier\u0119 karijeru kariyerine kari\xE9ru kari\xE9ry karne karo karon karriere karri\xE4r kart kartu kart\u0105 karusakan karya kar\u015F\u0131 kar\u015F\u0131s\u0131nda kas kasadpan kasadpang kasagaran kasagbotan kasaluruahan kasama kasarangang kashf kasneje kasnije kasteel kasus kasutada kasutatakse kasvaa kat kata katalizuje katalog kategori kategorie kategorii kategoriserar katere katerega katerem kateri katerih katero katholieke katholische katholischen katholischer kati katika katolicki katolik katolikus katolske katonai katta kat\u0131ld\u0131 kaudella kauden kaudu kaufte kaum kaumahan kaunti kaupungin kaupungissa kaupunki kausi kautta kawaida kawasan kay kaya kayu kazand\u0131 kazi ka\u017Cdego ka\u017Cdej ka\u017Cdy ka\u017Cdym ka\u017Ed\xE9 ka\u017Ed\xFD ka\u017Ee kde kdo kdy kdy\u017E keadaan kebangsaan kebanyakan kebijakan kecamatan kecil kecuali kedua keduanya kedudukan kedy keel keeles keelt keem keempat keen keep keeping keeps keer keerde kegiatan kehidupan kehilangan kehrte kein keine keinen keiner keiser keizer kejadian kekuasaan kekuatan kela kelab kelahiran kelas keleti kelikely kelio kell kelle kellett kelompok keluar keluarga kelurahan kemampuan kematian kembali kemenangan kemendagri kemerdekaan kemudian kemudiannya kemungkinan ken kende kendi kendisine kendt kendte kenek keng kening kenin\xFCkam\xFC kennen kennis kent kenta\xF1 kepada kepala kept keputusan ker kerajaan kerana keras keren kereskedelmi kereszt\xE9ny kereszt\xFCl kereta keret\xE9ben kerja kerk kernel kerran kertaa kertoo kerusakan ker\xFCl ker\xFClt ker\xFCltek kes keseluruhan keskus kes\xE4kuuta kes\xE4ll\xE4 ket ketiga ketika ketinggian ketua keturunan keur keversoort kev\xE4\xE4ll\xE4 key keyboard keyboards keys kez kezdett kezdte kezdve kezd\u0151d\xF6tt ke\xE7iril\u0259n ke\u010F khai khan khas khi khi\u1EBFn khi\u1EC3n khoa kho\u1EA3n kho\u1EA3ng khu khusus khususnya kh\xE1 kh\xE1c kh\xE1ch kh\xE1ng kh\xED kh\xF3 kh\xF3a kh\xF4 kh\xF4ng kh\xFAc kh\u0103n kh\u1EA3 kh\u1EA3o kh\u1EA9u kh\u1EAFc kh\u1EAFp kh\u1ECFi kh\u1ED1i kh\u1EDFi kh\u1EE7ng kiad\xE1s kick kids kiedy kielen kierowa\u0142 kierownik kierunku kila kilala kilder kilka kilku kill killed killer killing kills kilo kilometara kilometatra kilometer kilometers kilometre kilometres kilometrga kilometrin kilometri\xE4 kilometro kilometr\u016F kilom\xE8tres kilpailuissa kilpailun kil\xF3metros kim kimi kimia kin kinabasaan kinabugnawan kinadak kinadul kinahabogang kinainitan kinase kinaugahan kind kinderen kinders kinds kinesisk kinesiska kinesiske king kingdom kings kinh kini kinne kino kira kiradi kiri kirik kirja kirjailija kirjanik kirjoitti kirke kirken kirkko kirkon kir\xE1ly kir\xE1lyi kis kisah kisbolyg\xF3\xF6v\xE9ben kisebb kiselina kishi kishin kishte kisoissa kit kita kitab kitab\u0131 kitara kitchen kiti kitra kit\u0173 ki\xE7ik ki\u015Fi ki\u1EBFm ki\u1EBFn ki\u1EC3m ki\u1EC3u ki\u1EC7n kjeldene kjem kjend kjende kjent kjente kjer kjo kladograma klar klare klart klarte klas klasa klase klasean klasik klasse klassen klassieke klassische klassischen klassisk klasy klasyfikacji klasztoru klein kleine kleinen kleiner kleinere kleineren kleines kleur kleuren klima klimatzonen klip klippformationer klooster klub kluba klubas klubben klubem klubie klubu knapp knee knew kniha knihy knjiga knjige knji\u017Eevne knji\u017Eevnih knji\u017Eevnosti knocked knockout knots know knowing knowledge known knows knyttet koadroko koadrotan kobiet kobiety kod kode koe koga kogu koha koht kohta kohti koh\xEB koja koje kojeg kojem koji kojih kojim kojima kojoj kojom koju kokatua kokatuta kokku koko kokonaan kol kola kolam kole kolei kolejne kolejny kolejnych kolejowa kolem kolm kolmanneksi kolmas kolme kolmen kolo koloni kolonie kolovoza kom koma komanda komandas komandu kome komedi komen komertzialetatik komertzioetatik komma komme kommen kommer kommet kommt kommun kommunadir kommune kommunen kommuner komo komon komot kompanii kompanija kompleks komplett komplex komponist kompozytor komputer komt komtio komun komuna komunikasi komunikazio komunitas komuniti komun\xEB komyun kon konca konce koncem koncept koncert koncertu konci koncu kondado konden konderria konderrian kondisi kone konec konferencija konflik konflikt konfliktu kong konge kongelige kongen koniec koning koningin konkurencji konkurrerer konkurs konkursie konnen konnte konnten konpontze konpontzeko konsep konser konsert konst konstant konstrukcji kontado kontak kontakt konte kontinente kontrak kontrakt kontre kontrol kontroll kontrolu kontsultatua konu konusunda koor koos koostuu kop kopi kop\u0101 kop\u0161 kor kora korai korban korda koriste koristi koristiti korm\xE1ny koronantsary korpus korral korrik kort korte kor\xE1ban kor\xE1bban kor\xE1bbi koska koskaan kostel kostela kosten kosti kot kota koumanse kovo ko\u0142o ko\u0144ca ko\u0144cu ko\u015Bciele ko\u015Bcio\u0142a ko\u015Bci\xF3\u0142 kpt kracht kraft kraftig kraj kraja krajach kraje krajem kraji krajine krajiny kraju kraj\xF3w kralj kralja krav kra\u0161to kreeg kregen krey\xF2l krievu krig krige krigen kriget krijgen krijgt kring kristen kristne kritik kritika kritike kritisiert krog krom\u011B kroner kroppen krouet kroz krvi kr\xE1l kr\xE1le kr\xE1lovstv\xED kr\xE1tce kr\xE4ftdjursart kr\xF3l kr\xF3la ksi\u0105\u017Cek ksi\u0105\u017Cki ksi\u0105\u017C\u0119 ksi\u0119cia kszta\u0142t kterou kter\xE1 kter\xE9 kter\xE9ho kter\xE9m kter\xFD kter\xFDch kter\xFDm kte\u0159\xED ktorej ktorom ktor\xE1 ktor\xE9 ktor\xE9ho ktor\xED ktor\xFA ktor\xFD ktor\xFDch kt\xF3ra kt\xF3re kt\xF3rego kt\xF3rej kt\xF3ry kt\xF3rych kt\xF3rym kt\xF3rzy kt\xF3r\u0105 kuasa kuat kubwa kuda kuhusu kui kuid kuin kuitenkaan kuitenkin kulit kulkee kullan\u0131lan kullan\u0131l\u0131r kullar kulle kultaa kultur kultura kulture kulturelle kulturn\xED kulturore kultury kultur\xE1lis kult\xFAra kult\u016Bros kumbang kumpulan kun kuna kunde kundi kund\xEBr kune kung kuni kuning kuningas kunna kunnan kunne kunnen kunnes kuno kunst kunta kuoli kup kupa kuperad kur kura kurang kuras kuri kuriame kurie kurio kurioje kurios kuris kuri\u0173 kurs kuru kurulan kurulmu\u015Ftur kurz kurze kurzen kurzer kur\u0101 kur\u012F kur\u0161 kus kust kuten kutha kutoka kutsutaan kuu kuulub kuului kuulus kuuluu kuuluva kuuluvat kuusi kuwa ku\u0107a ku\u0107e kvadrat kvadratkilometer kvar kvart kvinder kvinner kvinnor kv\u011Btna kv\u011Btnu kv\u016Fli kwa kwadrado kwam kwamba kwamen kwanza kwenye kwietnia kwietniu kyl\xE4 kymmenen kyrka kyrkan kyrkja kyrkje kysten kytara k\xE4igus k\xE4lla k\xE4llan k\xE4mpfte k\xE4nd k\xE4nda k\xE4vi k\xE4ytettiin k\xE4ytetty k\xE4ytet\xE4\xE4n k\xE4ytti k\xE4ytt\xE4\xE4 k\xE4ytt\xF6\xF6n k\xE4yt\xF6ss\xE4 k\xE8k k\xE9ker\xE9 k\xE9o k\xE9pes k\xE9sz\xEDtett k\xE9sz\xFClt k\xE9s\u0151bb k\xE9s\u0151bbi k\xE9t k\xEAnh k\xEAr k\xEBsaj k\xEBtij k\xEBto k\xEBt\xEB k\xEDch k\xEDnai k\xEDnh k\xEDv\xFCl k\xF2m k\xF5ige k\xF5ik k\xF6lt\xF6z\xF6tt k\xF6lt\u0151 k\xF6niglichen k\xF6nne k\xF6nnen k\xF6nnte k\xF6nnten k\xF6nyv k\xF6r k\xF6rben k\xF6r\xFCl k\xF6r\xFClbel\xFCl k\xF6sz\xF6nhet\u0151en k\xF6t\xF6tt k\xF6vetkezt\xE9ben k\xF6vetkez\u0151 k\xF6vet\u0151 k\xF6vet\u0151en k\xF6y k\xF6yde k\xF6yd\xFCr k\xF6zben k\xF6zel k\xF6zeli k\xF6zel\xE9ben k\xF6zep\xE9n k\xF6zponti k\xF6zs\xE9g k\xF6zs\xE9gekkel k\xF6zt k\xF6zt\xFCk k\xF6z\xE9 k\xF6z\xF6s k\xF6z\xF6tt k\xF6z\xF6tti k\xF6z\xFCl k\xFCla k\xFClas k\xFClf\xF6ldi k\xFCls\u0151 k\xFCl\xF6n k\xFCl\xF6nb\xF6z\u0151 k\xFCl\xF6n\xF6sen k\xFC\xE7\xFCk k\u0131sa k\u0131sm\u0131 k\u013Cuva k\u0259nd k\u0259ndi k\u0259ndind\u0259 k\u0259\u015Ff k\u1EBFt k\u1ECBch laag laat laatste lab laba labai labdar\xFAg\xF3 label labels labiah labing labon labor laboratoire laboratorio laboratorium laboratory labour laburpena lac lack lade lado lados lady lag laga lagata lage lagen lager laget lagi lago lagos lagt lagu laguna lah lahan laharam laharan lahat lahir lahko lai laid laika laiku laik\u0101 laim\u0117jo lain lainnya lair laissant laisse laisser laiss\xE9 lait laivaston lakaet lake lakes laki lakin lakini lakosa lakoss\xE1g lakoss\xE1g\xE1nak lakos\xE1b\xF3l lalat lalawigan lalek lalu lama lamang lambda lambok lamela lan lana lanaw lance lancement lancer lancio lanc\xE9 land lande landed landen landet landets landing landmark lando lands landsby landsbyen landscape landskapet landskommun landslaget landul lane lanean lang langabezian langage langau lange langen langer langit langs langsam langsung langt language languages langue langues lank lanm\xE8 lansat lanza lanzada lanzado lanzamiento lanz\xF3 lan\xE7a lan\xE7ada lan\xE7ado lan\xE7amento lan\xE7ou lao lap lapangan lapkri\u010Dio laporan laps lapt\xF6rt\xE9nete laquelle lar larga large largely largement larger largest largeur largo lart\xEB larva larvae las lasang lascia lasciando lasciare lasciato lasci\xF2 laser laskettiin lassen last lasta lasted lasting lat lata latach late laten later lateral laterale laterales laterali latere latest lati latim latin latina latine latino latinos latitude lato latter latvie\u0161u lat\xEDn lau laude laulaja laulja laulu launch launched laurea laut lautet lav lava lave lavitra lavora lavorare lavorato lavori lavoro law lawah laweh laws lawsuit lawyer lay layanan layer layers layiq layout lea lead leader leaders leadership leading leads leaf league leagues learn learned learning learns lease least leave leaves leaving leben lebenden lebih lebt lebte lebten lec lecci\xF3 lectura lecture lecturer lectures lecz led ledamot ledde lede ledelse leden leder ledet lediglich ledna lednu leeft leeftijd leer left leg lega legacy legal legale legally legal\xE1bb legata legate legati legato lege legend legenda legendary leger legfontosabb legge leggenda leggera leggere leggermente leggi legi legislation legislative legislatura legislature legjobb legnagyobb legno legs legt legte legt\xF6bb legyen lehden lehen lehenengo lehet lehetett lehet\u0151v\xE9 lehnte lehrte lei leicht leidde leiden leider leiding leidybos leigod\xFC leis leit leitet leitete lejos lekarz leker leksikon lelaki lema lembaga lemesed lemesedi lemn len lendemain lenga lenge lenger lenghe lengre lengte length lengths lengua lenguaje lenguas lengyel lenk lens lent lenta lentamente lente lento leo lequel ler leraar lernte les lesa lesen lesi\xF3n lesquelles lesquels less lesser lessons leste lesz let leta letech letih leto letoma letra letras lett letter lettera letteratura lettere letters letto lettre lettres letu lety letzte letzten letzter letztlich leur leurs leuwih leva levando levar levde leve level levels leven levende lever levert levou levy lewat lewe lexikon ley leyenda leyes lez le\xE8l le\u017Cy le\u017Ei le\u017E\xED lhe lhes liaison lib liber libera liberaci\xF3n liberal liberale liberdade libero libertad libert\xE0 libert\xE9 libr libraries library libre libres libreto libretto libri libro libros liburu lib\xE9ral lib\xE9ration lica licence licencia license licensed licentie licenza lichaam licht liczba liczby liczb\u0119 liczne licznych liczy\u0142a lid lider liderada liderado lidt lidze lid\xE9 lid\xED lie lied lief liefde liegen liegenden liegt lien liens liep liepos lies liet lietuvi\u0173 lieu lieutenant lieux lie\xDF lie\xDFen lifayelas lifayels life lifestyle lifetime lift lig liga ligada liga\xE7\xE3o lige ligeramente ligesom ligg liggaam liggen ligger ligging liggt light lighting lights ligi ligne lignende lignes ligt ligue ligy liiga liigan liige liitettiin liittyi lijkt lijn lijst lik lika like likely likevel liknande liksom lille lima limba limbi limestone limit limita limitada limitado limite limited limites limits limit\xE9e lindiyans lindur line linea lineal linear linee lineo liner lines lineup lingkungan lingua linguagem linguaggio lingue linguistic ling\xFC\xEDstica linh linha linhas linia linie linii linija linje link linked linken linking links linky linn linna lion lipca lipcu lipnja liquid lire list lista listade listan listas liste listed listen listening listing listopada listopadu listopadzie listrik lists listy lis\xE4ksi lit lite liten liter literacy literal literally literalmente literaria literario literary literatura literature literatury literatuur litoral litres litt litteratur little litt\xE9raire litt\xE9raires litt\xE9ralement litt\xE9rature liv live lived livelli livello liver lives livet living livre livres livro livros livskraftig liyan\xE9 lize lizentziarekin li\xE9 li\xE9e li\xE9es li\xE9s li\xEAn li\xF1a li\u015Bcie li\u1EC1n li\u1EC7t li\u1EC7u ljudi llac llama llamada llamadas llamado llamados llamar llam\xE1u llam\xF3 llarg llarga llargo llargu llat\xED llau llavors llawer lle llega llegada llegado llegan llegando llegar llegaron lleg\xF3 llei lleis llengua lleng\xFCes lletres lleva llevaba llevado llevan llevar llevaron llev\xF3 llibre llibres llibru lliga llindar llingua lling\xFCes llinia llista lliure lloc llocs llogaters llogats llograr llogr\xF3 llugar lluita llum lluosog lluz llyfrau load loaded loading loan loans loc locais local locale locales locali localidad localidade localidades localitate localitatea locality localit\xE0 localit\xE9 localit\u0103\u021Bii localiza localizada localizado locally locals located location locations locatit locaux lock loco locomotive locomotives locuitori locuitorilor locul lod lodi lod\xED log logam logements logic logiciel logique logo logra logrando lograr lograron logr\xF3 loi loin lois lokakuussa lokakuuta lokal lokala lokale lokalen lokasi lokony lomanef lomanefa lomanefas lomanefs long longa longe longer longest longitud longo longs longtemps longtime longue longues longueur lontano loob look looked looking looks loop loopkevers loopt loose lopen loppuun lopulla lopulta lopussa lor lord lore loro lors lorsqu lorsque lortu los lose loser losing loss losses lost lot lotniczy lots lotta lov love loved lover loves low lower lowest loyal lo\xE0i lo\u010F lo\u1EA1i lo\u1EA1n lo\u1EA1t lua luar luas luat lub luce lucha lucht lucru lucr\u0103ri ludno\u015Bci ludzi luego lugar lugares lugha luglio lui luka lukuun lulus lume lumea lumi\xE8re luna lunar lune lunet\xFC lung lunga lunghe lunghezza lunghi lungo lungsod lungul luni luoghi luogo luokan lupt\u0103 luta lutego lutte lutym luvulla luvulta luvun luwih luxe luxury luy\u1EC7n luz lu\xF2c lu\xF4n lu\u1EADn lu\u1EADt lyckades lyc\xE9e lye lyen lying lykas lykwols lyrics lys lze l\xE0m l\xE0ng l\xE1that\xF3 l\xE2m l\xE2n l\xE2ng\u0103 l\xE2u l\xE3nh l\xE4bi l\xE4hedal l\xE4hell\xE4 l\xE4hes l\xE4hinn\xE4 l\xE4hti l\xE4htien l\xE4it l\xE4ks l\xE4mnade l\xE4n l\xE4nder l\xE4net l\xE4ngd l\xE4nger l\xE4ngere l\xE4ngre l\xE4ngs l\xE4pi l\xE4s l\xE4sst l\xE4st l\xE4uft l\xE5g l\xE5gvuxen l\xE5ng l\xE5nga l\xE5nghorningar l\xE5ngt l\xE5tar l\xE5ten l\xE6ngere l\xE6rer l\xE8s l\xE9gales l\xE9gende l\xE9gislatives l\xE9g\xE8rement l\xE9pett l\xE9tre l\xE9v\u0151 l\xEAn l\xEBtzebuergesche l\xEDcula l\xEDcules l\xEDder l\xEDderes l\xEDmite l\xEDmites l\xEDnea l\xEDneas l\xEDngua l\xEDnguas l\xEDnh l\xEDnia l\xEDnies l\xEDquido l\xF2ng l\xF3gica l\xF4ng l\xF5i l\xF5petas l\xF6danas l\xF6danefa l\xF6d\xF6p l\xF6d\xF6ps l\xF6lik l\xF6ste l\xF6vf\xE4llande l\xF6vskog l\xF8bet l\xF8pet l\xFAc l\u0129nh l\u012Bdz l\u01B0u l\u01B0\u01A1ng l\u01B0\u1EE3c l\u01B0\u1EE3ng l\u01B0\u1EE3t l\u1EA1c l\u1EA1i l\u1EA5y l\u1EA7n l\u1EABn l\u1EADp l\u1EC7nh l\u1ECBch l\u1EDBn l\u1EDBp l\u1EDDi l\u1EE3i l\u1EE5c l\u1EEDa l\u1EF1a l\u1EF1c maa maaaring maailma maailman maailmansodan maak maakond maakonnas maakt maakte maakten maal maalia maaliskuuta maan maand maanden maar maart mab mac macam macchina mach machen machine machinery machines macho machos macht machte machten made madeira madera madh madhe madinidinika madre mae maestro maestros mafia mag maga magas magasin magazine magazines maggio maggior maggioranza maggiore maggiori maggiormente maghiar\u0103 magia magic magister maglia magna magnetic magnitud magnituda magnitude magnitudinem magnitudo magyar magyarorsz\xE1gi magyarul mag\xE1t mah maha mahallede mahalledir mahasiswa mahisok mai maiden maig maij\u0101 mail maillot main mainland mainly mains mainstream maintain maintained maintaining maintains maintenance maintenant maintenir maio maior maiores maioria maior\xEDa maire maires mairie mais maison maisons maist maith maj maja majalah majd majetku majeur majeure maji majka major majoria majoritatea majority majorit\xE9 majors maju maj\xED maj\xFA maj\u0105 maka makala makan makanan make maken maker makers makes makeup making makke maksimum makt mal mala maladie maladies malah malaltia malalui malam malaria malarz malattia male malen males malgrat malgr\xE9 mali malih malik mall malo mal\xE1 mal\xE9 mal\xFD mam mama mamakan mamiliki mammals mampiasa mampu mampunyoi mam\xEDferos man mana manage managed management manager managers manages managing manakala manana manca mancanza manche manchen manchmal mand mandat mandate mandato mando mandray mandritry maneira manera mang manga mange manggerek mangrupa mangsa mani manier maniera manifestacija manifestation manifestations manifestazione mani\xE8re manj manjadi manje mankany manlalaro mann mannen manner mano manodidin manor manos manque mans mansion mantan mantener mantenere mantenimiento mantenir manter manteve mantiene mantuvo manual manufacture manufactured manufacturer manufacturers manufacturing manuscript manuscripts manuscrit manuscrits manusia many manyebabkan manyerap man\u017Eelka mao map mapa mapi mapping maps mar mara maradt marang marathon marble marbre marc marca marcada marcado marcador marcando marcapada marcar marcas march marcha marche marchese marchio march\xE9 marco marcou marcu marc\xF3 mare marec marge margen margin marginal margolaria mari mariage mariajita marido marin marina marine marines marinespecies marins maritime marito mari\xE9 mari\xE9e mari\xF1a mark marked marker market marketed marketing markets marking marks markt marmo marque marques marquis marqu\xE9 marqu\xE9e marqu\xE9s marraskuussa marraskuuta marriage married marry marr\xEB marr\xF3n mars mart marta martial martie marts mart\u0101 marupokan marzo marzu mar\xE7 mar\xE7o mar\xE9chal mas masa masalah masas maschi maschile mascles masculin masculina masculine masculino mase masia masih masing masjid mask maso masoandro mass massa massacre masse masses massif massima massimo massive master mastering masters masu masuk masunod masyarakat mat mata matag matahari matans matar match matcher matches matchs mate mateix mateixa matematica matematik matematika matem\xE1tica matem\xE1tico mater materia materiaal materiais material materiale materiales materiali materials materia\u0142u materijala materna maternal math mathbf mathematical mathematics mathrm math\xE9matiques mati matin mati\xE8re matka mato matoari matrice matrimoni matrimonio matrix matriz matter matters mature maty mat\xE9riaux mat\xE9riel mau maupun mauvais mavjud max maxi maxim maxima maximal maximale maxime maximum may maya maydonidir mayo mayor mayores mayor\xEDa mayu ma\xDFgeblich ma\xE7 ma\xE7ta ma\xE7\u0131nda ma\xED ma\xEEtre ma\xEEtres ma\xEEtrise ma\xF1 ma\xF1ana mbalimbali mbi meados mean meaning means meant mear measure measured measurement measurements measures measuring meat mecanismo mecanismos mechanical mechanics mechanism mechanisms mecz meczach mecze meczu mecz\xF3w mec\xE1nica med medaglia medaglie medaili medaille medal medale medalha medalista medalje medalla medallas medals medan mede medeltemperaturen media mediados median mediana mediante medias medical medicina medicine medico medida medidas medie medieval medievale medikal medio medios mediu medium medlem medlemmar medlemmer medley medtem medverkade medyo medzi mee meer meerdere meerderheid meest meestal meeste meet meeting meetings meets meg meget megfelel\u0151 megfelel\u0151en meghalt megjelent meglio megye megyei megy\xE9ben mehr mehrere mehreren mehrerer mehrfach mehrmals mei meia meilleur meilleure meilleures meilleurs mein meine meio meir meist meisten meistens meitat mejor mejorar mejores melaksanakan melakukan melalui melanjutkan melawan melebihi melhor melhores melibatkan melihat meliputi melko mellan mellem mellett mellom mellor melodia mely melyben melyek melyet melynek memainkan memakai memakan memasuki membaca membangun membantu membawa membentuk member memberi memberikan members membership membrana membrane membre membres membri membro membros membru membuat membuka membunuh memegang memenangi memenangkan memenuhi memerintah memerlukan memilih memiliki memimpin meminta memoria memorial memories memory memperoleh mempertahankan mempunyai memulai memutuskan mem\xF2ria mem\xF3ria men mena menace menampilkan menang menarik mencapai mencari menciona mencionado menciptakan mencoba mendapat mendapatkan mendean mendirikan menduduki mendukung menemukan menengah menentang menentukan mener menerima mengadakan mengalahkan mengalami mengambil mengandung mengandungi mengatakan mengebor mengeluarkan mengembangkan mengenai mengetahui menggambarkan menggantikan menggunakan menghadapi menghasilkan mengikut mengikuti mengubah mengumumkan meni menikah mening meninggal meninggalkan meningkat meningkatkan menit menjabat menjadi menjadikan menjalankan menjelaskan menm menn menneske mennesker menness\xE4 meno menolak menor menores menos mens mensaje menschlichen mense mensen ment mental mentale mente mention mentioned mentions mentor mentre mentres ment\xE9n menu menudo menuju menulis menunjukkan menurut menyatakan menyebabkan menyebut menyediakan menyelesaikan menyerang menyertai menys men\xE9e men\u0161\xED mer mera merah meraih merasa mercado mercados mercat mercato merchant merchants merci mere mereka merely merge merged merger meri meridional meridionale merito merk merkezi merkezine mert merujuk merupakan mes mesa mese meses mesi mesin meskipun mesma mesmes mesmo mesmos mesmu mesos messa message messages messe messo mest mesta mestadels mestaruuden meste mester mesto mestre mestu mesura mesure mesures met meta metade metais metal metall metara metatra meteen meter meters method methods metod metoda metode metodi metodo metody metr metra metre metres metri metric metrin metri\xE4 metro metropolitan metropolitana metros metrov metr\xF3w metr\u016F mettant mette mettent mettere mettre metu metus met\xE0 met\u0173 meu meur meurt meurtre mevcuttur mewakili mewn mexicana mexicano meydana meyor mezcla mezi mezin\xE1rodn\xED mezun mezvalora mezzi mezzo me\xF0 me\xF0al me\u0111u me\u0111utim mga mia miaka mianowany miast miasta miasto miatt mia\u0142 mia\u0142a mia\u0142o mia\u0142y mic mica mich mici micro mic\u0103 mid mida middel middelalderen midden middle mide midfielder midi midis midt midten miejsc miejsca miejsce miejscowo\u015Bci miejscowo\u015B\u0107 miejscu mieli miembro miembros miembru mientras mientres miesi\u0119cy miestas mieste miesten miesto mieszka\u0144c\xF3w mieux mie\u0107 mie\u015Bcie mig might miglior migliore migliori migration mihodikodina mikasikan mikor mik\xE4 mil mild mile miles milh\xF5es milieu milieux milijuna milik milimetro milioane milion miliona milioni milions milion\xF3w milion\u016F milita militaire militaires militant militante militants militar militare militares militari militars military militer militia milit\xE4rische milit\xE4rischen milit\xE6r milit\xE6re miljard miljoen miljoner miljoonaa milk mill millas mille milles millest milli milliards milliers millimeter million millioner millions milliy milli\xF3 millones millor millors mills mill\xEE mill\xF3n mill\xF3ns milyon mimo min mina minaccia minangka minas mind minden minder mindestens mindig mindk\xE9t mindre mind\xF6ssze mine mineral minerals mines mineur ming minggu minh mini minima minimal minime minimo minimum mining miniserie minister ministers ministra ministre ministres ministro ministros ministru ministry minist\xE8re mink\xE4 minne minor minore minori minoritate minority minsken minst minste mint mintaqasida mintegy minulosti minus minut minuta minute minuten minutes minuti minuto minutos minutter minyak mio mir mira mirip miris mirror mir\xEB mis misalnya mise mises misi misiones misi\xF3n misma mismas mismo mismos miss missed missile missiles missing mission missionary missione missioni missions miss\xE3o miss\xE4 misterioso mistrovstv\xED mistrz mistrza mistrzem mistrzostw mistrzostwach mistrzostwo misura misy mit mitad miteinander mitjana mitjans mitjan\xE7ant mitj\xE0 mito mitologia mitt mitte mittelalterlichen mittels mitten mittlere mittleren mittlerweile mitu mit\xE4 miut\xE1n mivel mix mixed mixing mixtape mixte mixture miz mizaka mi\xEAu mi\u0119dzy mi\u1EC1n mjeseci mjesta mjestima mjesto mjestu mji mjr mj\xF6g mkoa mkuu mln mnamo mniej mnoge mnogi mnogih mnogim mnogo mnoha mnoho mno\u017Estv\xED moartea mobil mobile moc mocht moci mocy mod moda modalit\xE0 mode model modeli modell modellen modelli modello modelo modelos models modelu moderate modern moderna modernas moderne modernen modernes moderni moderno modernos modern\xED modes modest modesta modeste modi modificar modification modifications modifiche modified modo modos modtog modu modul module modules mod\xE8le mod\xE8les moeder moes moest moesten moet moeten mogao mogelijk mogla mogli moglie mogu mogu\u0107e mogu\u0107nost mog\u0105 moh mohl mohla mohli mohou moi moindre moines moins mois moitas moiti\xE9 moito moitos moja mokslo moksl\u0173 mokykla mokykloje mokyklos mokykl\u0105 mol molecular molecules molekul molekula molekulsku molen moll molt molta molte moltes molti molto molts molupyo mol\xE9culas momencie moment momenti momento momentos moments momentu momentum mon monarca monarchie monarqu\xEDa monasterio monastero monastery monast\xE8re mond monde mondial mondiale mondiali mondo moneda monestir monet money monia monitor monitoring monks mono monoparentals monster monstrat monsunklimat mont montagna montagne montagnes montana montant monta\xF1a monta\xF1as monte montes month monthly months montre montrent montrer montr\xE9 mont\xE9e monument monumental monumentale monumento monumentos monuments moon mor mora moral morale morali morceau morceaux more mori morir morire morning morreu mort morta mortal morte morti morto mortos morts mortuus mor\xEC mos mosaik mosque most mostly mostra mostrando mostrar mostr\xF3 mostu mot mota moteur moteurs moth mother motif motifs motion motiu motiv motive motivi motivo motivos moto motor motora motorcycle motore motores motori motors mots motto moulin moun mountain mountains mounted mourir mourut mouse mouth mouvement mouvements move movebatur moved movement movemento movements moves movie movies moviment movimenti movimento movimentos movimiento movimientos movimientu moving moyen moyenne moyens mo\u0159e mo\u017Ce mo\u017Cliwo\u015Bci mo\u017Cliwo\u015B\u0107 mo\u017Cna mo\u017Eda mo\u017Ee mo\u017Eno mo\u017Enost mo\u017Enosti mo\u017En\xE9 mpanao mpanoratra mph mpikambana mpilalao mponina msnm mto mua muassa much mucha muchas mucho muchos muda mudah mudan\xE7a mudan\xE7as mudar mudo mudou muere muerte muerto muertos muestra muestran muga muiden muita muitas muito muitos mujer mujeres mukaan mukana mula mulai mulher mulheres mulieri muliero mulig muligt muller mulleres mult multa multe multi multimedia multimediale multiple multiples multitud multzoan mul\u021Bi mumkin mun munches munchos muncul mund mundial mundo mundu mungkin municipais municipal municipale municipales municipalitat municipalities municipality municipalit\xE9 municipi municipio municipios municipis municipium munic\xEDpio munic\xEDpios munisipalidad munisipyo muntanya muntanyes muore mur mura mural muralla murder murdered murders murid murit muri\xF3 muro muros murs muscle muscular museet musel museo museu museum museums musi music musica musicais musical musicale musicales musicali musicals musiche musician musicians musicien musiciens musicista musicisti musik musika musiker musikk musim musiqi musique muss musste mussten must musuh musulmana musulmanes musulmans mus\xE9e mus\xED mutat mutation mutations mutatja mutlakna mutlaknya mutlaknyo muto mutta mutual muu muun muut muuta muutti muy muyer muyeres muzej muzeja muzeum muzic\u0103 muziek muzik muzikos muzyka muzyki mu\u017Ei mu\u017Eov mu\u017E\u016F mu\u0219te mu\u1ED1n mwa mwaka mwyaf mwyn mycket mye mykje mysterious mystery mythology my\xF6hemmin my\xF6s my\xF6t\xE4 m\xE0n m\xE0sima m\xE0u m\xE0xim m\xE0xima m\xE1is m\xE1ja m\xE1jus m\xE1lo m\xE1quina m\xE1quinas m\xE1r m\xE1rcius m\xE1s m\xE1sik m\xE1sodik m\xE1u m\xE1xima m\xE1ximo m\xE1y m\xE2le m\xE3e m\xE3o m\xE3os m\xE4n m\xE4nniskor m\xE4rts m\xE4rtsil m\xE4tare m\xE4\xE4r\xE4 m\xE5de m\xE5l m\xE5naden m\xE5nader m\xE5neder m\xE5nga m\xE5ste m\xE5te m\xE5tte m\xE6nd m\xE8ne m\xE8re m\xE8t m\xE8tode m\xE8tres m\xE9canique m\xE9daille m\xE9decin m\xE9decine m\xE9dia m\xE9dias m\xE9dica m\xE9dico m\xE9dicos m\xE9dio m\xE9g m\xE9gis m\xE9i m\xE9lange m\xE9moire m\xE9nages m\xE9n\u011B m\xE9rk\u0151z\xE9sen m\xE9s m\xE9t m\xE9ter m\xE9teres m\xE9thode m\xE9thodes m\xE9tier m\xE9todo m\xE9todos m\xE9trage m\xE9tro m\xE9tropolitaine m\xEAme m\xEAmes m\xEAs m\xEBnyr\xEB m\xECnh m\xECnima m\xEDg m\xEDnima m\xEDnimo m\xEDsta m\xEDstech m\xEDstn\xED m\xEDsto m\xEDst\u011B m\xEDt m\xF2rt m\xF3don m\xF3g\u0142 m\xF3n m\xF3r m\xF4i m\xF4n m\xF4\u017Ee m\xF4\u017Eu m\xF5is m\xF5isa m\xF6chte m\xF6glich m\xF6gliche m\xF6glichen m\xF6glicherweise m\xF6glichst m\xF8tte m\xF9a m\xFAltiples m\xFAsica m\xFAsicas m\xFAsico m\xFAsicos m\xFCasir m\xFCcadele m\xFCdafi\u0259 m\xFCdd\u0259t m\xFCmk\xFCn m\xFCndet m\xFCssen m\xFCxt\u0259lif m\xFCzik m\xFC\u0259yy\u0259n m\u0117n m\u0119\u017Cczyzn m\u011Bl m\u011Bla m\u011Bli m\u011Blo m\u011Bly m\u011Bsta m\u011Bstem m\u011Bsto m\u011Bstsk\xE9 m\u011Bst\u011B m\u0169i m\u016F\u017Ee m\u0171k\xF6dik m\u0171k\xF6d\xF6tt m\u01B0a m\u01B0u m\u0259rk\u0259zi m\u0259\u015Fhur m\u0259\u015F\u011Ful m\u1EA1ch m\u1EA1i m\u1EA1ng m\u1EA1nh m\u1EA5t m\u1EABu m\u1EADt m\u1EAFt m\u1EB7c m\u1EB7t m\u1EC1m m\u1ECDi m\u1ED1i m\u1ED7i m\u1ED9t m\u1EDBi m\u1EDDi m\u1EE5c m\u1EE9c m\u1EF1c naam naar naast nabij nabijgelegen nace nach nachdem nachgewiesen nacht nach\xE1dza nach\xE1z\xED nacida nacido nacija nacimiento nacionais nacional nacionales nacionalista nacionalnog naciones naci\xF3 naci\xF3n nacque nad nada nadal nadat nadie nadmorskoj nadmo\u0159sk\xE9 nado nafar nafngifta nag nagara naging naglibot nagrada nagrade nagrado nagradu nagroda nagrody nagrod\u0119 nagu nagusia nagusietatik nagy nagyobb nagyon nah nahe nahezu nahi nahilalakip nahimutang nahimutangan nahiz nahm nahmen nai naik naimisissa naissance naisten naixencia naj najbardziej najbli\u017Eih najbolj najbolje najbolji najcz\u0119\u015Bciej najlepszy najlepszych najmanji najmniej najm\xE4 najni\u017E\u0161\xED najpierw najve\u0107a najve\u0107i najvi\u0161e najwi\u0119kszych naj\u010De\u0161\u0107e nak nakalista nakon nakonec nalaze nalazi nalazila nalazio nale\u017Ca\u0142 nale\u017Ca\u0142a nale\u017Cy nale\u017C\u0105 nalika nalista nalukop nam nama naman namanya name named namelijk namely namen namens names naming namme namn namnet namngivna namun nam\xE1i nan nana nang nanging nannte naopak nap napad napada napisao napisa\u0142 napr napravio napr\xEDklad napsal nap\u0159 nap\u0159\xEDklad nar narod naroda narodil narodowej narra narrativa narrative narratives narrator narrow narys nas nasa nasbih nasce nasceu nascido nascita nascut naselja naselje naseljeno naseljenosti naseljima naselju nashrida nasional nasjonale naskah naslov naslovom nasod nastaje nastala nastoupil nastupa nast\u0119pnie nast\u0119puj\u0105ce nat nata natal natale natao nation national nationale nationalen nationales nationalist nationality nationally nationaux nations nationwide nativa native nativo nativos nato natomiast natten nattflyn natur natura naturais natural naturale naturales naturaleza naturali naturalista naturally nature naturel naturelle naturelles natureza naturlig naturreservat natus nat\xFCrliche nat\xFCrlichen nau nauczyciel nauk nauka nauki naukowych nautical nav naval navale navata nave naves navi navigation navio navios navire navires navn navnet navodi navy nav\xEDc nawet nay nazi nazionale nazionali nazione nazioni nazis naziv naziva nazivaju nazivom nazwa nazwie nazwy nazw\u0105 nazw\u0119 na\xEEt na\u010Din na\u021Bional na\u021Bional\u0103 nchi nchini nda ndaj ndan ndani nde nden ndodhet ndryshme nd\xEBrsa neamd near nearby nearest nearly neben nebo neboli nebo\u0165 nebula nebuvo nebyl nebyla nebylo necesaria necesario necesidad necesidades necessari necessarily necessario necessary necessidade necessit\xE0 necess\xE1rio nechal neck ned nedaleko neden nedeniyle nederb\xF6rd nedlagt need needed needs neem neemt nef neft negara negativ negativa negative negativo negen negeri negli nego negocio negocios negotiations negra negras negre negres negro negros negru negyedik nehmen nei neid neidr neige neighborhood neighboring neighbourhood neighbouring neist neither nej nejen nejlep\u0161\xED nejprve nejsou nejvy\u0161\u0161\xED nejv\u011Bt\u0161\xED nej\u010Dast\u011Bji nek nekaj nekaterih nekazaritza neke neki nekih nekim nekog nekoliko nekom nektar nek\u0101 nel neli\xF6kilometri\xE4 nelj\xE4 nell nella nelle nello nem nema nemen nemet nemici nemico nemzeti nemzetk\xF6zi nem\xE1 nen nende nenhum nenhuma nennen nennt nens nen\xED neo nephew nepi ner nera nere nero nerve nes nese nesk\xF4r nessa nesse nessun nessuna nessuno nest nesta neste nesten net network networks neu neue neuen neuer neues neuf neun neutral neve never nevet neveu nevez nevezt\xE9k nev\xE9n nev\xE9t nev\u0171 new newly news newspaper newspapers newydd next ne\xE7\u0259 ne\u0107e ne\u0161to ne\u017E nga ngadto ngan ngang nganggo nganjrek nganti ngaran ngay nghe nghi nghi\xEAm nghi\xEAn nghi\u1EC7m nghi\u1EC7p ngh\u0129 ngh\u0129a ngh\u1EC1 ngh\u1EC7 ngh\u1EC9 ngh\u1ECB ngora ngo\xE0i ngo\u1EA1i ngunit nguy nguy\xEAn ngu\u1ED3n ng\xE0nh ng\xE0y ng\xE2n ng\xF4i ng\xF4n ng\u0103n ng\u01B0\u1EDDi ng\u01B0\u1EE3c ng\u1EA7m ng\u1EAFn ng\u1ECDt ng\u1EDD ng\u1EEF ng\u1EF1a nhanh nhau nhi\xEAn nhi\u1EC1u nhi\u1EC5m nhi\u1EC7m nhi\u1EC7t nhm nh\xE0 nh\xE1nh nh\xE2n nh\xECn nh\xF3m nh\u01B0 nh\u01B0ng nh\u1EA1c nh\u1EA5t nh\u1EADn nh\u1EADp nh\u1EADt nh\u1EB1m nh\u1EB9 nh\u1EC7n nh\u1ECF nh\u1EDB nh\u1EDD nh\u1EEFng nic nich nicht nichts nich\u017E nici nickname nicknamed nid nie nieco nieder niederl\xE4ndischen niego niej nieko\u013Eko niekt\xF3re niekt\xF3rych niem niemal niemand niemiecki niemieckich niemieckiego niemieckiej niet niets nieuw nieuwe nifer nigdy niger night nights nigra nii niiden niin niini niist\xE4 niit\xE4 nije nikada nikdy nilai nim nime nimell\xE4 nimelt\xE4\xE4n nimen nimens\xE4 nimetatakse nimi nimitettiin nimmt nin nincs nine nineteenth ning ninguna ning\xFAn ninja ninth ninu nipote niso nisu nisulans nit niti nito nitrogen niveau niveaux nivel niveles nivell niv\xE5 niya niz ni\xEAn ni\xF1a ni\xF1o ni\xF1os ni\u0105 ni\u017C ni\u1EC7m nje njega njegov njegova njegove njegovi njegovih njegovim njegovo njegovog njegovom njegovu njem njema\u010Dki njema\u010Dkoj njemu njen njena njene njih njihov njihova njihove njihovih njihovo njim njima njohur njoj nj\xEB nobile nobili noble nobles noblesse noch noche nochmals noci nocy node nodig noe noen nog nogen noget nogle nogometa\u0161 nogometni noho noi noiembrie noin noir noire noirs noise noite nok noko nokre nom nombor nombrado nombre nombres nombreuses nombreux nombroses nombrosos nombr\xF3 nome nomeado nomen nomenat nomes nomi nomina nominal nominated nomination nominations nominato nomine nominee nominiert nomme nomm\xE9 nomm\xE9e nomor noms nom\xE9s non nonch\xE9 none nonostante nooit noong noordelijke noorden nopeasti nor norbanakoentzako nord nordeste nordlige nordost nordvest nordv\xE4st nordv\xE4stra nordwestlich nord\xF6stlich nord\xF6stra nord\xF8st noreste norma normal normale normally normalment normalmente normalt normas normativa norme normes noroeste norr norra norrut nors norsk norske norte north northeast northeastern northern northwest northwestern norvegese nos nosaukumu nose nosi nostra nostri not nota notable notables notably notamment notar notare notas notation note noted noten noter notering notes notevole nothing noti notice noticia noticias notika noting notion notizia notizie noto notre notte notwendig nou nous nousi nouveau nouveaux nouvel nouvelle nouvelles nou\u0103 nov nova novada novamente novanta novas nove novel novela novelas novelist novels november novembra novembre novembril novembro novembr\u012B noves novi novia noviembre novih novo novog novos novou novu nov\xE1 nov\xE9 nov\xE9ho nov\xFD nov\xFDch nov\u011B now nowe nowego nowej nowo nowy nowych nowym now\u0105 noyabr nozze npr nta nt\xE2 nt\xF4 nua nuair nuclear nucleares nucleo nucleus nucli nucl\xE9aire nuestra nuestro nuestros nueva nuevamente nuevas nueve nueves nuevo nuevos nuevu nuit nuk nul null nulla nulo num numa numai number numbered numbers nume numele numelor numer numera numeri numero numeroase numerosas numerose numerosi numerosos numerous numit numit\u0103 nummer nummers num\xE9rique num\xE9ro num\u0103r num\u0103rul nun nuna nunca nunha nunmehr nuo nuorten nuova nuovamente nuove nuovi nuovo nur nurse nutzen nutzte nuvarande nuv\xE6rende nuwe nu\xF4i nya nya\xE9ta nye nyelv nyelven nyelv\u0171 nyert nyerte nyingi nykyisin nyky\xE4\xE4n nyn\xED nyt nytt nytta nyugati ny\xE1ri ny\xEDlt n\xE0o n\xE0y n\xE1m\u011Bst\xED n\xE1rodn\xED n\xE1sledn\u011B n\xE1sleduj\xEDc\xED n\xE1vrh n\xE1zev n\xE1zov n\xE1zvem n\xE1zvom n\xE1\xE0 n\xE2ng n\xE3o n\xE4chste n\xE4chsten n\xE4her n\xE4in n\xE4iteks n\xE4itleja n\xE4mlich n\xE4r n\xE4ra n\xE4rheten n\xE4rmaste n\xE4stan n\xE4yttelij\xE4 n\xE5dde n\xE5ede n\xE5gon n\xE5got n\xE5gra n\xE5r n\xE6r n\xE6sten n\xE9anmoins n\xE9bula n\xE9cessaire n\xE9cessaires n\xE9cessit\xE9 n\xE9e n\xE9erlandais n\xE9gy n\xE9h\xE1ny n\xE9ixer n\xE9lk\xFCl n\xE9met n\xE9met\xFCl n\xE9o n\xE9pess\xE9ge n\xE9pess\xE9g\xE9nek n\xE9t n\xE9v n\xE9ven n\xEAn n\xEBn n\xEDm n\xEDos n\xEDveis n\xEDvel n\xED\u017E n\xF2rd n\xF3i n\xF3s n\xF3vember n\xF4ng n\xF6rdlich n\xF6rdlichen n\xF6v\xFC n\xFAcleo n\xFAcleos n\xFAi n\xFAm n\xFAmberu n\xFAmero n\xFAmeros n\xFCfus n\xFCfusu n\u0103m n\u0103ng n\u0103scut n\u0117ra n\u011Bj n\u011Bkdy n\u011Bkolik n\u011Bkolika n\u011Bkter\xE9 n\u011Bkter\xFDch n\u011Bm n\u011Bmecky n\u011Bmeck\xE9 n\u011Bmeck\xFD n\u011Bm\u017E n\u0131n n\u0151i n\u01A1i n\u01B0\u1EDBc n\u0259f\u0259r n\u0259tic\u0259l\u0259ri n\u0259tic\u0259sind\u0259 n\u0259\u015Fr n\u1EA1n n\u1EAFm n\u1EB1m n\u1EB7ng n\u1EBFu n\u1EC1n n\u1ED1i n\u1ED5i n\u1ED9i n\u1EEDa n\u1EEFa oak oameni oan oant oare oba obale obali obce obci obc\xED obdobju obdob\xED obec obecnie obefolkad obejmuje oben ober oberen oberhalb obertures obicei obiekt\xF3w obiettivo obispo obitelji obi\u010Dno objavil objavio objavljen object objecte objectes objectif objectifs objectiu objective objectives objects objek objekata objekt objektu objet objetivo objetivos objeto objetos objets obj\xE9k obj\u0105\u0142 oblast oblasti oblast\xED obligation obligations oblik oblika obliki obliku obok obou obozu obra obras obraz obrazu obrazy obres obrony obro\u0144cy obr\u0119bie obsahuje observa observar observation observations observatoire observe observed observer obstacles obstant obstante obszar obszary obszarze obtain obtained obtaining obtener obteniendo obtenir obtenu obtenus obter obteve obtiene obtient obtuvo obu obvious obvod obvykle obwodzie obwohl obyekt obyekti obyektlari obyektni obyvatel obyvate\u013Eov obzirom ob\u021Binut oca ocasiones ocasi\xE3o ocasi\xF3n ocato oca\u011F\u0131 occasion occasional occasionally occasione occasioni occasions occhi occhio occidental occidentale occidentales occidentali occidentalis occidente occitan occitana occupa occupation occupazione occupe occupied occup\xE9 occur occurred occurring occurs ocean och ocho ochobre ochrany ochrony ocidental ocks\xE5 ocorre ocorreu octobre octombrie octubre ocupa ocupaci\xF3n ocupada ocupades ocupado ocupando ocupar ocupat ocupats ocupaven ocup\xF3 ocurre ocurri\xF3 oc\xE9an oc\xE9ano oda odby\u0142 odby\u0142a odby\u0142y odc odcinek odcinku odd oddzia\u0142 oddzia\u0142u oddzia\u0142y odehr\xE1l oder ode\u0161el odkryta odlazi odleg\u0142o\u015Bci odmah odnosi odnosno odnosu odszed\u0142 odznaczony oed oedd oer oest oeste ofensiva oferta off offen offenbar offenen offense offensive offentleg offentlig offentlige offer offered offering offers office officer officers offices official officially officials officieel officiel officielle officiellement officier officiers offici\xEBle offisielle offiziell offizielle offiziellen offre offs offshore oficer oficer\xF3w oficiais oficial oficialament oficiales oficialment oficialmente oficials oficina oficinas oficjalnie ofisiel ofiziala ofizialki ofrece ofruktbar oft ofta oftast ofte often oftest ogen oggetti oggetto oggi ogni ogs\xE5 og\xE9 ohella oherwydd ohi ohne oil ois oiseau oiseaux oito ojca ojciec ojo ojos oka okazji oko okoli okolicach okolicy okolo okol\xED oko\u0142o okraji okrem okres okrese okresie okresu okrug okruga okrugi okrugu okruhu okruzi okr\u0105\u017Caj\u0105ca okr\u0119gu okr\u0119t okr\u0119tu okr\u0119t\xF3w oksigen oktober oktobra oktobr\u012B oktoober oktoobril oktyabr okt\xF3ber okt\xF3bra okulu okupaturik okviru ola olabilir olan olandese olar olarak olaraq olasz old oldal oldalon oldal\xE1n older oldest oldu olduk\xE7a oldu\u011Fu oldu\u011Fundan oldu\u011Funu ole oleh oleks olema olemassa oleva olevan olevat oli olib olid olika olim olimpiai olimpici olimpijski olimpijskich olio olisi olivat olive olla olleen olleet ollut olmak olmaqla olmas\u0131 olmas\u0131na olmayan olmu\u015F olmu\u015Fdur olmu\u015Ftur olnud olona olsa oltre olub olunan olunmu\u015F olunmu\u015Fdur olunub olunur olup olur olu\u015Fan olu\u015Fur olyan olympialaisissa olympijsk\xFDch olympique olympiques olympisk olympiska olympiske ol\xEDmpica ol\xEDmpico oma oman ombori omborida ombra ombre omdat omega omfattande omfattar omfattende omfatter omgeving omgivande omgivningarna omicidio omkring omna omonima omonimo omr\xE5de omr\xE5den omr\xE5der omr\xE5det omstandigheden omtalt omtrent omvat ona onbekend once oncle ond onda ondan ondas onde onder onderdeel onderfamilie onderscheiden onderstaande onderwijs onderzoek ondoren ondorengo ondorioz one ones ongeveer ongoing oni onlar onlara onlar\u0131 onlar\u0131n online only onnistui ono onore ons ont ontdekt onto ontstaan ontstaat ontstond ontving ontwerp ontwikkel ontwikkeld ontwikkelde ontwikkeling ontworpen onu onun onwards onze oog ooit ook oor oorlog oorsprong oorspronkelijk oorspronkelijke oosten opci\xF3n opdracht open openbare opened opening openly opens opera operaciones operaci\xF3n operacji operar operasi operate operated operates operating operation operational operations operative operativo operator operators operazione operazioni opera\xE7\xE3o opera\xE7\xF5es opere opery opet opf\xF8rt opgeheven opgenomen opgericht opgevolgd opinion opinions opini\xF3n opis opiskeli opisuje opleiding opnieuw oportunidad oportunidades oposici\xF3n oposi\xE7\xE3o opp oppdaga oppdaget oppervlakte oppf\xF8rt oppgav oppidum oppkalt opponent opponents opportunities opportunity oppose opposed opposing opposite opposition opposizione opprettet opprinnelig opprinnelige oppure oprichting oprindelige oproti opr\xF3cz opstand optical optimal option optional options optreden opus opvolger op\xE9ra op\xE9ration op\xE9rations op\u0107enito op\u0107i op\u0107ina op\u0107ine op\u0107ini op\u011Bt op\u0161tina op\u0161tine op\u0161tini ora orada oral orang orange oraz ora\u0219 ora\u0219ul ora\u0219ului orbit orbita orbital orbitalem orbitalis orbitalium orbite orbit\u0103 orchestra orchestre ord ordained orde ordem orden ordena ordenado ordeni orden\xF3 order ordered orders ordet ordf\xF6rande ordinary ordine ordini ordningen ordo ordre ordres ordu ordusu ore oreeginal org organ organi organic organik organisasi organisatie organisation organisations organise organised organiser organisiert organisierte organisme organismes organismo organismos organisms organist organista organis\xE9 organis\xE9e organitzaci\xF3 organizace organizacija organizacije organizaciones organizaci\xF3n organizacji organizacj\u0119 organizada organizado organizar organization organizations organiza\xE7\xE3o organize organized organizzata organizzato organizzazione organo organsko orgel orgue ori orice orientaci\xF3n oriental orientale orientales orientali orientalis orientation oriente oriented origem origen origin origina originaire original originala originale originales originali originally originalmente originaria originariamente originario originated origine originele origines origini origins orile orilla orixe orixinal orkest orkester orkid\xE9art orkid\xE9er orllewin ormai ornamental oro orosz orqali orquesta orquestra orsz\xE1g orsz\xE1gos ort orta ortak ortaya orthodoxe ortodox oru or\xEDgenes osa osaa osada osady osales osallistui osam osan osaturik osatutako osatzen oscuro ose osi osim osi\u0105gn\u0105\u0142 osnivanja osnovan osnovu oso osob osoba osobe osobn\xED osoby ospedale ospita oss ossia ostal ostala ostalaritza ostale ostali ostalih ostalim ostao ostatecznie ostatni ostatnich ostatnim ostatn\xED osti ostrov ostrova osvojil osvojila osvojio osztr\xE1k oszt\xE1ly\xE1nak os\xF3b otac otec otettiin other others otherwise otkri\u0107e otok otoka otoku otomatig otorg\xF3 otorite otra otras otres otro otros otru otrzyma\u0142 otrzyma\u0142a ott ottanta ottelua ottelun ottelussa ottenendo ottenere ottenne ottenuto otti ottiene otto ottobre oud oude oudere ouders oudste ouest our ouro out outbreak outcome outcomes outdoor outer outils output outra outras outre outro outros outside outstanding outubro ouvert ouverte ouverture ouvrage ouvrages ouvre ouvriers ouzh ova ovaj oval ovanligt ovat ove over overall overcome overfor overf\xF8rt overgenomen overheid overleden overleed overlijden overseas overtok overwinning ovest ovih ovim ovo ovog ovoj ovom ovu ovvero ov\u0161em owa own owned owner owners ownership owns oxygen oynad\u0131 oynanan oyun oyuncu oziroma oznacza oznaka ozna\u010Dava ozna\u010Den\xED ozna\u010Duje o\xE8st o\u010Di o\u011Flu o\u017Eenil o\u017Eujka paar pabaigoje pacahan pace pachina paciente pacientes pack package pad pada padi pado padre padres padr\xE3o paese paesi pag pagal pagamento pagar pagasta pagasts pagast\u0101 page pages paghatag pagi pagina paginam pagine pagkainila pagkayana pago pai paid pain paint painted painter painting paintings pair pairs pairt pais paix paj pak pakigbingkil pal pala palabas palabra palabras palace palacio palais palasi palavra palavras palazzo palco pale palibot paling paljon palju palkinnon pallacanestro palm pal\xE1cio pamamagitan pami\u0119ci pamoja pamukaan pan panahon panas panel panels pang panggerek pangkat pangunahing pani panjang panjangnyo panonpo\xE9 panorama panstv\xED pantai pantalla paositra papa papal papan pape papel papeles paper paperback papers papier papie\u017C papie\u017Ca paprastai par para parada parade parafia parafii paraiaran parairan paral paralelo parallel parall\xE8le parameters parar paras parasit parasti paraula paraules para\xEEt parc parce parceria parcial parcialmente parco parcours pare parece parecer parecido paredes pareja parella parelles parent parents pares paret parete pareti parfois parhaan pari parish parishes paritany park parken parking parks parku parla parlament parlamentare parlamentet parlamento parlamentu parlare parle parlement parlementaire parlementaires parler parliament parliamentary parl\xE0 parmi parochie paroisse parola parole paroles parque parques parrocchia parrocchiale parroquia parroquial parr\xF2quia pars part partage partai parte partea partecipa partecipanti partecipare partecipato partecipazione partecip\xF2 partenza partes parti partial partially participa participaci\xF3n participado participando participant participantes participants participar participaron participat participate participated participating participation participa\xE7\xE3o participe participent participer participou particip\xE9 particip\xF3 particle particles particolare particolari particolarmente particular particulares particularly particularmente particulars particulier particuliers particuli\xE8re particuli\xE8rement partida partidas partido partidos partie partiellement parties partiet partii partij partija partijen partijos partir partire partis partisan partisans partit partita partite partition partito partits partj\xE1n partly partner partners partnership parto partout parts party part\xEDculas part\xEDos part\xEDu paru parvient par\xE7as\u0131 par\xEB pas pasa pasado pasajeros pasando pasangan pasar pasaron pasaules pasaulio pasaulyje pase pasi paso pasos pasou pass passa passado passage passageiros passagem passagers passages passaggio passando passant passar passaram passare passat passato passe passed passeggeri passen passenger passengers passer passes passing passion passione passive passo passou pass\xE0 pass\xE9 pass\xF2 past pasta pastatyta pasti pastor pastoral pasu pasukan pasur pas\xF3 pat patag patas patch patedik patent patente path pathway pati patient patients patio patria patriarca patrimoine patrimonio patrol patron patrona patrons patru patr\xED patr\xF3n pats pattern patterns pat\u0159\xED pau pauc paura paus pavadinimas pave pay payares payer paying payment payments pays paysage paz pa\xEDs pa\xEDses pa\xEFsos pa\u0144stw pa\u0144stwa pa\u017Adziernika pa\u017Adzierniku pdf peab peace peak peaked peaks peale peamiselt peau pecahan peces peculiar pedagog pedal pedido pedig pedra peer pegawai pehintaniny peine peint peintre peintres peinture peintures peix peixes pejabat pek pekerja pekerjaan pel pela pelaa pelaaja pelajar pelakon pelannut pelas pelasi pelbagai pelea peli peligro pelle pellicola pelo pelos pels pel\xEDcula pel\xEDculas pel\xEDcules pemain pembangunan pemerintah pemerintahan pemilihan pemimpin pen pena penal penalty penampilan pendant pendek pendent pendidikan penduduk penelitian penerbangan pengaruh pengembangan pengetahuan pengguna penggunaan penghargaan peninsula penisola penn pennad pensa pensamiento pensar pense penser pensiero pension pens\xE9e pentadbiran penting pentru penuh penulis penumpang penyakit penyanyi pen\xEDnsula people peoples pequena pequenas pequeno pequenos peque\xF1a peque\xF1as peque\xF1o peque\xF1os per peran peranan perang perangkat peraturan perbandaran percaya perceived percent percentage perception perch\xE9 perci\xF2 percorso percussion percussioni perd perda perdagangan perdana perde perdendo perder perdeu perdido perdiendo perdita perdi\xF3 perdre perdu perempuan perfect perfil perform performance performances performed performer performers performing performs pergi perhaps perhatian pericolo perifeliany periferia perin peringkat perioada perioad\u0103 period perioda periode perioden periodi periodiskt periodista periodo periods periodu peristiwa peri\xF3dico peri\xF3dicos perjalanan perjanjian perkataan perkembangan perkhidmatan perkusja perlawanan perlu permainan permanece permanecer permaneceu permaneci\xF3 permanent permanente permanently permesso permet permetre permettant permette permettent permettre permis permission permit permite permiten permitir permitiu permiti\xF3 permitted permukaan pernah pero perqu\xE8 pers persa perse persecuci\xF3n persiska perso persoane persoas person persona personagem personagens personaggi personaggio personaje personajes personal personale personales personalidad personalidades personality personalit\xE0 personally personalmente personas personatge personatges personaxe personaxes persone personen personer persones personi personnage personnages personnalit\xE9 personnalit\xE9s personne personnel personnelle personnes persons persoon perspectiva perspective perspectives pers\xF6nlichen pertahanan pertama pertamanya pertamo pertandingan pertanian pertanto pertany pertanyent perte pertempuran pertence pertencente pertenece pertenecen perteneciente pertenecientes pertenec\xEDan pertengahan pertes perthyn perto pertsona pertsonak pertsonek peruano perubahan perusahaan perusteella perustettiin perustettu perusti perustuu per\xEDode per\xEDodo per\xEDodos per\xF2 pes pesante pesar pesawat pesca pese pesem peserta pesmi peso pesos pesquisa pessoa pessoal pessoas peste pet petit petita petite petites petition petits petrol petr\xF3leo peu peul peuple peuples peur peut peuvent peyi pez pezzi pezzo pe\xE7a pe\xE7as pe\u0142ni pe\u0142ni\u0142 phare phase phases phenomenon phi philosophe philosopher philosophical philosophie philosophy phim phi\xEAn phi\u1EBFu phone phong photo photographer photographie photographs photography photos php phrase physical physically physician physics physique ph\xE1 ph\xE1i ph\xE1n ph\xE1o ph\xE1p ph\xE1t ph\xE2n ph\xE9nom\xE8ne ph\xE9p ph\xEA ph\xED ph\xEDa ph\xF2ng ph\xF3 ph\xF3ng ph\xF9 ph\xFAt ph\u01B0\u01A1ng ph\u01B0\u1EDDng ph\u1EA1m ph\u1EA3i ph\u1EA3n ph\u1EA7n ph\u1EA9m ph\u1EADn ph\u1ED1 ph\u1ED1i ph\u1ED5 ph\u1EE5 ph\u1EE5c ph\u1EE7 pia pian pianeta piani pianist pianista piano pianoforte pianta piante piazza piccola piccole piccoli piccolo pick picked pico picture pictures pide pidettiin pidet\xE4\xE4n pidi\xF3 pie piece pieces piechoty pied piedal\u012Bj\u0101s piedi piedra pieds piel piem\u0113ram piena pieni pieno pierde pierre pierres pierwsza pierwsze pierwszego pierwszej pierwszy pierwszych pierwszym pierwsz\u0105 pies pietra pietus pieza piezas pihak piiri pikeun pili piliakalnis pilihan pilot pilota pilote pilotes piloti piloto pilotos pilots pils\u0113ta pils\u0113tas pimpinan pin pinakaduol pindah pindala pine pink pinta pintar pintor pintu pintura pinturas pintures pinyin pioneer piosenki pipe piramidea pirates pirenen pirmasis pirmininkas pirmo pirms pir\xE0mide pis pisac pisarz pisma pismo piso pisos pista pistas piste pistes pistol pistola pit pitch pitched pitcher piti pitk\xE4 pitk\xE4\xE4n pittore pittura pituus pit\xE4\xE4 piuttosto piyasaya pi\xE8ce pi\xE8ces pi\xF9 pi\u0119ciu pi\u0119\u0107 pi\u0142karski pi\u0142karsk\u0105 pi\u0142karz pi\u0161e pjesama pjesma pjesme pjes\xEB pkt pla plaas plaats plaatsen placa placas place placed placement placer places placing plac\xE9 plac\xE9e plads plage plain plaine plak plan plana plane planer planes planet planeta planetang planetas planete planetesimal planetisimal planetoida planets planned plannen planning plano planos plans plant planta plantas plantation plante planted planten planter plantes plants planu plan\xE8te plan\xE9t plan\xE9tisimal plaque plaques plasma plass plassen plassert plastic plasuje plat plata plataforma plataformas plate plateau plates platform platforms platino platinum plats platsen platt plat\xED play playa played player players playing playoff playoffs plays playwright plaza plazo pla\xE7a plc plein pleine plek plemena plena pleno plis ploeg plot pls plu plupart plura plural plus pluse plusieurs plut\xF4t pnas pne poate poblacional poblaciones poblacions poblaci\xF3 poblaci\xF3n poblado poble pobles pobli\u017Cu pobl\xED\u017E poboaci\xF3n pobre pobres pobresa pobreza pobytu pob\u0159e\u017E\xED poc poca pocas poche pochi pochodzenia pochodzi pochowany poch\xE1z\xED poco pocos pocs pocu pocz\u0105tkowo pocz\u0105tku pod podaci podacima podataka podatke poda\u0159ilo podczas pode podem podemos poden podendo poder poderes poderia poderosa poderoso podia podio podium podjela podj\u0105\u0142 podle podobne podobnie podobn\u011B podob\u011B podpisa\u0142 podporu podria podro\u010Dju podru\u010Dja podru\u010Dje podru\u010Dju podr\xEDa podr\xEDan podstawie podzia\u0142u pod\xEDa pod\xEDan pod\u013Ea poeg poem poema poemas poems poeng poesia poes\xEDa poet poeta poetas poetry poets poging pogosto pohon poh\xE1r poi poich\xE9 poids poika point pointe pointed points pois poissons pojava pojavljuje pojawia pojawi\u0142 pokazuje pokok pokona\u0142 pokrajine pokrajini pokra\u010Duje pokud pol pola polacco polaco polar polas pole poleg polen poles poli police policial policier policies policy polic\xEDa poliitik polis politic politica political politically politice politiche politici politician politicians politick\xE9 politico politics politicus politic\u0103 politie politiek politieke politik politika politikai politike politiker politiko politiku politikus politinis politique politiques politisch politische politischen politisk politiska politiske politi\u010Dar politi\u010Dke politi\u010Dki politi\u010Dkih politycznych polityk polizia polja polje polk poll pollution polnische polnischen polo polonais polonaise polos polovici poloviny polovin\u011B polo\u017Eaj polo\u017Een\xFD polsk polska polski polskich polskie polskiego polskiej polskim polsko polu pol\xEDcia pol\xEDtic pol\xEDtica pol\xEDticas pol\xEDtico pol\xEDticos pol\xEDticu pol\xEDtiques pomeni pomi\u0119dzy pomoc pomoci pomocnika pomocy pomoc\xED pomoc\u0105 pomo\u0107 pomo\u0107u pom\u011Brn\u011B ponad ponadto pond pone ponekad poner poniewa\u017C ponin poni\u017Cej ponovno ponovo ponownie pont ponte ponto pontos ponts pool poole poolt poor poorly pop popis popisa popisu popolare popolari popolasi\xF9 popolazione popolazioni popolo poprv\xE9 poprzez populace populacional populaire populaires popular populares popularidad popularity popularmente populasi populasyon populated population populations popula\xE7\xE3o popula\u021Bia popula\u021Bie popula\u021Biei populer popullsi popul\xE6r popul\xE6re poput poques por pored porodica porodice porque port porta portada portail portal portale portando portant portanto portar portare portarono portata portato porte portent porter portes portfolio portion portions porto portoghese portrait portraits portrayed ports portugais portuguesa portugueses portugu\xE9s portugu\xEAs port\xE9 port\xE9e port\xF2 pory por\xE9m pos posar pose posebno posee poseen posesi\xF3n pose\u0142 posiada posibilidad posible posiblemente posibles posiciones posici\xF3 posici\xF3n posisi positie positif position positions positiv positiva positive positivo posizione posizioni posi\xE7\xE3o poslanec posle posledn\xED poslije posmatra\u010Da possa posse possession possessions possesso possibile possibili possibilidade possibility possibilit\xE0 possibilit\xE9 possible possibles possibly possiede possono possuem possui poss\xE8de poss\xE8dent poss\xE9dait poss\xEDvel post posta postaci postaje postal postala postali postao postavil posta\u0107 poste posted poster posterior posteriore posteriores posteriorment posteriormente posteriors postes posti postigao posto postoje postoji posts postup postupn\u011B postura poszczeg\xF3lnych pot potem potencia potencial potente potential potentially potenza poter potere poteri poteva potevano poti potoana potok potoka potom potpuno potrebbe potrebe potrebno potrzeby potuto pot\xE9 pou poucas pouco poucos poule pound pounds pour pourquoi pourrait poursuit poursuite poursuivre pourtant pouvaient pouvait pouvant pouvoir pouvoirs pouze pou\u017Eit\xED pou\u017E\xEDva pou\u017E\xEDv\xE1 poverty povijest povijesti povo povrchu povreso povr\u0161ine povr\u0161ini power powered powerful powers powiat powiatu powiecie powierzchni powierzchni\u0119 powie\u015Bci powie\u015B\u0107 powodu powo\u0142any powrocie powr\xF3ci\u0142 powstania powsta\u0142 powsta\u0142a powsta\u0142o powsta\u0142y powy\u017Cej poza pozd\u011Bji pozici poziom poznat poznata poznati poznatih poznato pozosta\u0142 pozosta\u0142ych pozycji pozycj\u0119 po\xE4ng po\xE8me po\xE8mes po\xE8te po\xE9sie po\u010Das po\u010Dela po\u010Deo po\u010Det po\u010Detka po\u010Detkom po\u010Detku po\u010Dinje po\u010Dtu po\u010D\xE1tku po\u0142owie po\u0142owy po\u0142o\u017Cona po\u0142o\u017Cone po\u0142o\u017Cony po\u0142udnie po\u0142udniowej po\u0142udniowo po\u0142udniowy po\u0142\u0105czenia pra prac prace pracoval pracowa\u0142 practical practice practiced practices pracuje pracy prac\u0119 prad\u0117jo prad\u017Eioje praefecturae praeses praia praise praised praksis praktfj\xE4rilar prakticky praktisch prantsuse prasid\u0117jo prata pratica praticamente pratique pratiques prav prava pravac pravd\u011Bpodobn\u011B pravi pravilima pravo pravom praw prawa prawdopodobnie prawie prawo prayer pre prebivalcev precedente precedentemente precedenti precedenza preceding precio precisa precisamente precise preciso precum precursor pred predator predecessor predicted prediction predikant predominantly predov\u0161etk\xFDm predsednik predsjednik predsjednika predstavlja predvsem prefectura prefeito prefekturen preferred pregleda\u010Du pregnancy pregnant pregunta prej prejel preko preliminary prema premi premier premiera premiere premiered premiers premio premios premises premiu premi\xE8re premi\xE8res prenant prend prende prendere prendre prennent prensa preparaci\xF3n preparar preparation prepare prepared preparing presa presap\xF3ch prese presence presencia present presenta presentaci\xF3n presentado presentan presentano presentar presentation presentato presente presented presenten presenter presentes presenti presenting presents present\xF3 presenza presenze presen\xE7a preservation preserve preserved presiden presidencia presidencial presidency president presidenta presidente presidential presidentti presi\xF3n preso presos presque press presse pressi pression pressione pressi\xF3 presso pressure press\xE3o prestazioni prestige prestigio prestigious prestito presto pres\xE8ncia pret pretende preto preto\u017Ee pretty preuve preu\xDFischen prevalentemente prevede prevedeva prevent prevented preventing prevention previa previamente previous previously prevista previsto prey prezent prezidanto prezident prezidenta prezint\u0103 prezydent prezydenta prezzo pre\u010Dnik pre\u0219edinte pri pria pribadi pribli\u017Ene pribli\u017Eno price prices pride prie priest priests prieur\xE9 prie\u0161 prigionieri prije prijs prikazuje priklauso priklaus\u0117 prilikom prill prim prima primaire primaria primarily primary primavera prime primeira primeiras primeiro primeiros primele primer primera primeras primeres primero primeros primers primeru primi primit primitiva primitive primi\xE8r primjer primo primordial primul primus prim\xE4rfaktorn prim\xE6rt prin princ prince princes princesa princesse principais principal principale principalement principales principali principalment principalmente principals principal\u0103 principaux principe principes principessa principi principio principios principis principle principles princ\xEDpio prins prinsip print printed printemps printing printr printre prints prior priority pripada pripadnost pris prise prisen prises prisioneros prisi\xF3n prison prisoner prisoners prisonniers pristupljeno pris\xE3o prit privada privadas privado privat privata private privately privaten privind priv\xE9 priv\xE9e prix prize prizes priznanja pri\u010Da pri\u010Dom pro probability probabilmente probable probablement probablemente probably probe probintzian probleem problem problema problemas probleme problemen problemer problemes problemi problems probl\xE8me probl\xE8mes probl\xE9my procede procedente procedentes procedure procedures proceeded proceedings proceeds proceni procent procento proces procesa procesi\xF3n proceso procesos process processes processi processing processo processor processos processus procesu proche proches procjeni proclaimed procura proc\xE8s proc\xE9d\xE9 proc\xE9s prodotta prodotti prodotto producciones producci\xF3 producci\xF3n produce produced producen producent producer producers produces producida producido producing producir produci\xF3n product productes producteur productie production productions producto productor productora productores productos products produeix produir produire produit produite produits produjo produk produkcja produkcji produksi produksjon produkt produktion produktu produrre produs produsent produsert produto produtor produtos produttore produz produzida produzido produziert produzierte produzione produzir produ\xE7\xE3o prof profesional profesionales profesor profesora profesorem profesores professeur profession professional professionals professionista professionnel professionnelle professionnels professor professore professori professors profesyonel profil profile profissionais profissional profit profits profonde profondeur profondit\xE0 profunda profundidad profundo progetti progetto program programa programaci\xF3n programas programa\xE7\xE3o programes programma programme programmes programmet programmi programming programs programu progress progression progressive progressivement progr\xE8s prohibited proizvodi proizvodnje project projecte projection projects projekt projektu projet projeto projetos projets promedio prominent prominente promise promised promjene promoci\xF3n promosso promote promoted promoting promotion promotional promoveerde promover promovido promoviert promovierte promozione prompted promu prononciation pronounced pronssia pronto pronuncia proof prop propaganda proper properes properly properties property propi propia propias propiedad propiedades propietario propietaris propietat propio propioa propios propone proporciona proporcionar proportion propos proposal proposals propose proposed proposition proposta proposto propos\xE9 propre propres propri propria proprie propriedade proprietario propriet\xE0 proprio propri\xE9taire propri\xE9taires propri\xE9t\xE9 propri\xE9t\xE9s propuesta prop\xF3sito prosa prose prosent prosenttia proses prosinca prosince prosinci prostire prostor prostora prostoru prost\u0159ed\xED protagonist protagonista protagonistas protagonisti protagonizada protecci\xF3n protect protected protecting protection proteger protegida protein proteina proteins protest protesta protestante protests protezione prote\xEDna prote\xEDnas proti protiv proto protocol proton prototipo prototype proto\u017Ee prot\xE9ger prou proud prova provavelmente prove proved proven provenant proveniente provenientes provenienti proves provide provided provider providers provides providing proviene provient province provinces provincia provincial provinciale provincias provincie provincies provincii provinciji provinsen provinshuvudstaden provinsi provinsiyasi provision provisional provisions provoca provocando provocar provoc\xF3 provoque provozu prov\xEDncia prowadzi prowadzi\u0142 prowincji proximity proximit\xE9 proyecto proyectos proyek prueba pruebas pruvincia prva prvaka prve prvej prvenstva prvenstvo prvenstvu prvi prvih prvi\u010D prvky prvn\xED prvn\xEDch prvn\xEDho prvn\xEDm prvo prvog prvoj prvom prvu prv\xE9 prv\xFD przebywa\u0142 przeciw przeciwko przed przede przegra\u0142 przeniesiony przeni\xF3s\u0142 przestrzeni przeszed\u0142 przewodnicz\u0105cego przewodnicz\u0105cy przewodnicz\u0105cym przez prze\u0142omie przy przyj\u0105\u0142 przyk\u0142ad przypadku przyrody pr\xE0ctica pr\xE1ce pr\xE1ci pr\xE1ctica pr\xE1cticamente pr\xE1cticas pr\xE1tica pr\xE1va pr\xE1vo pr\xE1v\u011B pr\xE4sentiert pr\xE6sident pr\xE8s pr\xE9 pr\xE9cise pr\xE9cis\xE9ment pr\xE9c\xE9dent pr\xE9c\xE9dente pr\xE9fecture pr\xE9fet pr\xE9paration pr\xE9sence pr\xE9sent pr\xE9sentant pr\xE9sentation pr\xE9sente pr\xE9sentent pr\xE9senter pr\xE9sentes pr\xE9sents pr\xE9sent\xE9 pr\xE9sent\xE9e pr\xE9sidence pr\xE9sident pr\xE9sidente pr\xE9sidentielle pr\xE9voit pr\xE9vu pr\xEAmio pr\xEAt pr\xEAtre pr\xEDncep pr\xEDncipe pr\xF2pia pr\xF3pria pr\xF3prio pr\xF3prios pr\xF3xima pr\xF3ximas pr\xF3ximo pr\xF3ximos pr\xFCfe pr\u016Fb\u011Bhu pseudo pseudonym pseudonyme psi psl psychological psychologie psychology pub pubblica pubblicata pubblicati pubblicato pubblicazione pubblici pubblico pubblic\xF2 public publica publicaciones publicaci\xF3n publicada publicado publicados publicar publicat publication publications publica\xE7\xE3o publiceerde publicly publicou publics publicus public\xF3 publie publiek publik publikoetatik publikoko publikum publique publiques publish published publisher publishing publi\xE9 publi\xE9e publi\xE9es publi\xE9s pudiendo pudiera pudieron pudo pueblo pueblos pueblu pueda puedan puede pueden puente pueri puerta puertas puerto pues puesta puesto puestos puestu puhul puis puisqu puisque puissance puissant puisse puits pukul pula pulang pulau pull pulled pulo puluh pump pun puncak punct punika punishment punk punkt punkten punktu punkty punkt\xF3w puno punoan punt punta puntata punteggio punten punti punto puntos punts puntu punyo puolella puolestaan puolueen pupil pupils pur pura puramente purchase purchased pure puro purple purpose purposes pursue pursued pursuit puru pus pusat push pushed puso put puta putbol putea putem putih putra putri puts putting pu\xF2 pu\u0142k pu\u0142ku pu\u021Bin pvz pwovens p\xE0rquing p\xE1g p\xE1gina p\xE1ginas p\xE1ly\xE1ra p\xE1pa p\xE1r p\xE1rt p\xE1xina p\xE2n\u0103 p\xE4dugons p\xE4iv\xE4n\xE4 p\xE4rast p\xE4ritolu p\xE4\xE4asiassa p\xE4\xE4si p\xE4\xE4tteeksi p\xE4\xE4tti p\xE4\xE4ttyi p\xE8re p\xE8sonalite p\xE9ld\xE1ul p\xE9ninsule p\xE9rangan p\xE9rdida p\xE9rih\xE9lie p\xE9riode p\xE9riodes p\xE9s p\xEAche p\xEBr p\xEDsemn\xE1 p\xEDse\u0148 p\xEDsn\u011B p\xF2t p\xF3s p\xF3\u0142noc p\xF3\u0142nocnej p\xF3\u0142nocno p\xF3\u0142nocny p\xF3\u0142nocy p\xF3\u017Aniej p\xF6fasoliad p\xF6pinumam p\xF6sod p\xF6sods p\xFAblic p\xFAblica p\xFAblicas p\xFAblico p\xFAblicos p\xFAblicu p\u0113c p\u011Bt p\u011Bti p\u0142k p\u0142yty p\u0159ed p\u0159edev\u0161\xEDm p\u0159es p\u0159ev\xE1\u017En\u011B p\u0159i p\u0159ibli\u017En\u011B p\u0159i\u010Dem\u017E p\u0159\xEDli\u0161 p\u0159\xEDmo p\u0159\xEDpadn\u011B p\u0159\xEDpad\u011B p\u0159\xEDrodn\xED p\u016Fsobil p\u016Fsob\xED p\u016Fvodn\xED p\u016Fvodn\u011B p\u016Fvodu qalaktikad\u0131r qar\u015F\u0131 qayta qen\xEB qershor qeyd qeyd\u0259 qeyri qiladi qilgan qilish qishloq qismi qua quadro quae quai quais qual qualche qualcosa quale quali qualidade qualification qualifications qualifie qualified qualifier qualifiziert qualifizierte qualifi\xE9 qualify qualifying qualitat quality qualit\xE0 qualit\xE9 qualquer quals qualsevol qualsiasi quam quan quand quando quang quanh quant quantidade quantitat quantity quantit\xE0 quantit\xE9 quanto quantum quarante quart quarta quarter quarterback quarters quarti quartier quartiere quartiers quarto quarts quase quasi quatorze quatre quatri\xE8me quatro quattro quay que queda quedan quedando quedar quedaron qued\xF3 queen quegli quei quel quell quella quelle quelli quello quelque quelques quem quen quer queria quer\xEDa quest questa queste questi question questione questioned questions questo quest\xE3o queue qui quick quickly quien quienes quiere quiet quil\xF2metres quil\xF3metros quil\xF4metros quince quindi quinquennal quinta quinto quinze quit quite quitte quitter qui\xE9n quo quod quoi quota quoted quotidien quruqlik quy quy\u1EBFt quy\u1EC1n quy\u1EC3n qu\xE1 qu\xE1n qu\xE2n qu\xE8 qu\xE9 qu\xE9b\xE9cois qu\xEA qu\xEDmica qu\xEDmico qu\xEDmicos qu\xFD qu\u1EA3 qu\u1EA3n qu\u1EA3ng qu\u1EA7n qu\u1EADn qu\u1ED1c qu\u1EF9 qytetit q\u0131z\u0131 q\u0259bul q\u0259dim q\u0259d\u0259r raakte raccoglie raccolta racconta racconti racconto race races racial racing raconte rad rada radar rade radi radiaci\xF3n radial radiation radical radicale radie radio radios radius radu rady radyo ragazza ragazze ragazzi ragazzo raggiunge raggiungere raggiunse raggiunto ragione ragor rai raibh raid raids rail railroad railway rain rainfall rainha raio raionul raise raised raising raison raisons raja rajone rajonit rajono rak raka rakennettiin rakennettu rakyat rally rama ramach ramai ramas ramienia ramo ran rancangan rand random rang range ranges rangi ranging rango ranije rank ranked ranking rankings ranks raok rap rape rapid rapidamente rapide rapidement rapidly raport rappelle rapper rapport rapporti rapporto rapports rappresenta rappresentato rappresentazione rara raramente rare rarely rarement rares raro ras rasa rasi raskt rasmi raso rast raste rat rata rate rated rates rather rating ratings ratio ratu raw ray raya rayon rayonu rayonunda rayonunun raz raza razas razdoblju razem razliku razli\u010Dite razli\u010Ditih razli\u010Ditim razli\u010Dnih razloga razne raznih razones razvoj razvoja razvoju razy razza raz\xE3o raz\xF3n ra\xE7a ra\xEDces ra\xEDz ra\u011Fmen reacci\xF3n reach reached reaches reaching reaction reactions reactor read reader readers reading reads ready reais reakciju real reale reales realidad realidade realista realitat reality realitzar realiza realizaci\xF3n realizada realizadas realizado realizados realizan realizando realizar realizaron realizat realiza\xE7\xE3o realized realizou realizzare realizzata realizzati realizzato realizzazione realiz\xF3 really realmente realt\xE0 rear reas reason reasons reazione rebel rebeldes rebeli\xF3n rebellion rebels rebotes rebounds rebre rebuilt reca recalled recebe receber recebeu receive received receiver receives receiving recensement recensements recens\u0103m\xE2ntul recens\u0103m\xE2ntului recent recente recentemente recenti recently reception receptor receptors recerca recevoir recherche recherches rechi\xF3n recht rechte rechten rechter rechts rechtvleugelig recibe recibido recibir recibi\xF3 reciente recientemente recinto recipient reci\xE9n recognised recognition recognize recognized recommendations recommended reconhecimento reconnaissance reconnu reconocida reconocido reconocimiento reconstruction record recorde recorded recording recordings records recorrido recover recovered recovery recreational recruited recta rectangular rector recueil recuerda recuperaci\xF3n recuperar recurring recurso recursos red reda redakcija redaktor redakt\xF8r redan rede reden redes redor reduce reduced reducing reducir reduction reduziert reed reeds reeks reer ref refer refere referee reference references referencia referencias referendum referente referenties referir referred referring refers refer\xE8ncia refer\xEAncia refiere reflect reflected reflects reform reforma reformas reforms reformy reform\xE1tus refuge refugees refuse refused refuses regard regarded regarding regardless rege regel regele regelmatig regelm\xE4\xDFig regelui regent regentschap regering regeringen reggae regi regia regie regija regije regiji regime regiment regiments regina regio region regional regionale regionalen regionales regionali regionalnu regione regionen regiones regioni regionie regiono regions regionu regisseur regista register registered registration registrato registrazione registre registro registros regiunea regi\xE3o regi\xF3 regi\xF3n regi\xF3ne regi\xF5es regi\xF9 regjering regjeringen regla reglas regnat regne regnes regnet regnigaste regno regnskogsklimat regnum regolare regole regras regresa regresar regreso regres\xF3 regroupe regular regulares regularly regulated regulation regulations regulatory reg\xE9ny rehiyon rei reial reichen reicht reign rein reina reinado reine reino reinos reis reise reist reiste reizes rejected rejoindre rejoint rejonie rejyon rekao reke rekke rekna rekord rektor relacionada relacionadas relacionado relacionados relaciones relacions relaci\xF3 relaci\xF3n relais relasyon relate related relatie relatief relatif relating relation relations relationship relationships relativ relativa relativamente relative relatively relativement relatives relativno relativo relativt relato relatos relay relazione relazioni rela\xE7\xE3o rela\xE7\xF5es rele release released releases releasing relegated relegation relevant relevante reliable reliant relie relief relieve religie religieuse religieuses religieux religion religione religions religiosa religiosas religioso religiosos religious religi\xE3o religi\xF3n religi\xF6sen religi\xF8se relocated rel\xE8ve remain remainder remained remaining remains remake remarkable remarquable remember remembered remis remise remix remonta remonte remote removal remove removed removing remplace remplacement remplacer remplac\xE9 remporte remporter remport\xE9 ren renamed rencana rencontre rencontrent rencontres rend renda rendah rende rendelkezik rendere rendered rendezett rendezt\xE9k rendez\u0151 rendimiento rendj\xE9be rendre rendszer rendu renewed renn renomm\xE9e renovated renovation renowned rent renta renuncia reorganizacije rep repair repairs reparaci\xF3 repartia reparto repeat repeated repeatedly reperiebatur repertoire repertorio repertus replace replaced replacement replacing replica report reported reportedly reporter reporting reports repose reprann reprend reprendre represent representa representaci\xF3 representaci\xF3n representada representado representan representando representant representante representantes representar representation representative representatives represented representerte representing represents reprezentacji reprezentant reprezint\u0103 reprinted repris reprise reprises reproducerande reproduction repr\xE9sentant repr\xE9sentants repr\xE9sentation repr\xE9sentations repr\xE9sente repr\xE9sentent repr\xE9senter repr\xE9sent\xE9 reptiles republic republicano republice republika republiken republiky reputation rep\xFAblica request requested requiere require required requirement requirements requires requiring rerum res resa rescue rescued research researcher researchers reserva reservas reserve reserved reserves reservoir reside residence residencia resident residente residentes residential residents residenza resides residiendo residing resid\xE8ncies resignation resigned resistance resistencia resistenza resist\xE8ncia resist\xEAncia resmi reso resoluci\xF3n resolution resolve resolved resolver resort resource resources resp respect respecte respected respectiv respectivamente respective respectively respectivement respecto respeito respektive respond responded responsabile responsabilidad responsabilit\xE9 responsable responsables response responses responsibilities responsibility responsible respons\xE1vel resposta respuesta ressources rest resta restant restante restantes restauraci\xF3 restauraci\xF3n restaurant restaurante restaurants restauration restauro reste resten restent rester restes resti restlichen resto restoration restore restored restos restricted restrictions restu result resulta resultaat resultado resultados resultando resultat resultaten resultats resulted resulting results result\xF3 resumed ret retablo retail retain retained rete reter reti retirada retirado retirar retire retired retirement retiring retir\xF3 retning retornar retorno retornou retour retourne retrait retraite retrato retreat retrieved retrouve retrouvent retrouver retrouv\xE9 rett retten return returned returning returns reunir reuni\xF3 reuni\xF3n reu\u0219it rev revanche reveal revealed reveals revela revenge revenir revenu revenue revenuo revenus reverse revient review reviewed reviews revised revision revista revistas revival revived revizirani revolt revolta revoluci\xF3n revolution revolutionary revue rex rexi\xF3n rex\xF3n rey reyes rezidis rezultat rezultate re\xE7oit re\xE7u re\xE7ut re\u017C re\u017Cyser re\u017Cyserii re\u017E re\u017Eie re\u017Eiji re\u017Eis\xE9r re\u0219edin\u021Ba re\u0219edin\u021B\u0103 rhai rhan rhestr rhwng rhythm rhywogaeth riba rica ricca ricco rice ricerca ricerche riceve ricevette ricevuto rich riche riches richiesta richten richtete richting richtte rico riconoscimento riconosciuto ricorda ricos ricostruzione ridder ride rider riders ridge riding rien riesce riesgo riferimento riferisce rifle riforma rige right rights riguarda riguardanti riguardo riigi rijden rijeka rijeke rije\u010D rije\u010Di rijk rike riket riksdelen riktning rilievo rimane rimase rimasto rin ring ringkasnya rings rio rios riportato ripresa riprese riqueza risale risalente rischio risco rise riserva rises risiko rising risk risks risorse rispettivamente rispetto risposta risque risques risulta risultati risultato rit ritiene ritirato ritiro ritmo rito ritorno ritual riu rius riuscendo riusc\xEC riva rival rivalry rivals rive rivela river rivers rivier rivista rivi\xE8re rivolta rivoluzione ri\xEAng road roads roba robah robe robot robots robusta roca roce rock rocket rocks rod roda rodada rode rodiny rodu rodzaj rodzaju rodzina rodzinie rodziny roedd roet rohkem roi rois roja rojo rok roka rokoch rokov roku roky rol role roles roli roll rolle rollen roller rolling rolul rol\u0119 rom romain romaine roman romana romanas romance romances romane romanen romani romano romanos romans romantic romanu romanzi romanzo romersk romerske rom\xE0 rom\xE1n rom\xE2n rom\xE2ni rom\xE2n\u0103 rond ronda ronde rondom rood roof rookie room rooms root roots ropa ros rosa rose rossa rosso roster rostlin rosyjski rot rota rotation rote roten rotor roue rouge rouges rough roughly round rounded rounds route routes routine rovn\u011B\u017E row royal royale royaume rozd\xEDl rozegra\u0142 rozgrywek rozgrywkach rozhodl rozlohu rozpocz\u0105\u0142 rozpocz\u0119to rozpocz\u0119\u0142a rozvoj rozwoju rozw\xF3j ro\u010Dn\xEDku ro\u0111en ro\u015Blin ro\u015Bliny rpm rreth rua ruang ruas rubber ruch ruchu rud rue rues rugadh rugby rugpj\u016B\u010Dio rugs\u0117jo ruim ruimte ruines ruins ruisseau rujna rule ruled ruler rulers rules ruling rum rumah rummut run rund runde rundt rundzie runner runners running runs runsaasti runt runway ruoli ruolo rupa ruptura rupture rural rurale rurales rus rusa ruski rusky ruso rusos russa russe russes russianpost russisch russische russischen russisk russiske russo rus\u0103 ruta rutas rute ru\u1ED3i rychle rychlost rynku ryska rythme rytuose rytus ryt\u0173 rzecz rzeki rzek\u0105 rz\u0105d rz\u0105du rz\u0119du r\xE0ng r\xE0pidament r\xE1dio r\xE1mci r\xE1pida r\xE1pidamente r\xE1pido r\xE2ului r\xE4knas r\xE4tt r\xE5d r\xE5der r\xE6kke r\xE8gle r\xE8gles r\xE8gne r\xE9action r\xE9alisateur r\xE9alisation r\xE9alise r\xE9aliser r\xE9alis\xE9 r\xE9alis\xE9e r\xE9alis\xE9s r\xE9alit\xE9 r\xE9cemment r\xE9cit r\xE9cord r\xE9daction r\xE9duction r\xE9duire r\xE9duit r\xE9el r\xE9forme r\xE9f\xE9rence r\xE9f\xE9r\xE9nsina r\xE9gi r\xE9gime r\xE9gimen r\xE9giment r\xE9gion r\xE9gional r\xE9gionale r\xE9gionales r\xE9gions r\xE9guli\xE8re r\xE9guli\xE8rement r\xE9partis r\xE9partition r\xE9pond r\xE9pondre r\xE9ponse r\xE9publique r\xE9putation r\xE9seau r\xE9seaux r\xE9serve r\xE9sidence r\xE9sistance r\xE9sultat r\xE9sultats r\xE9sz r\xE9szben r\xE9sze r\xE9szt r\xE9sz\xE9n r\xE9sz\xE9t r\xE9union r\xE9unit r\xE9ussi r\xE9ussit r\xE9volte r\xE9volution r\xE9volutionnaire r\xE9v\xE8le r\xE9v\xE9n r\xE9\xE9dition r\xEAu r\xEAve r\xEDo r\xEDos r\xEDu r\xF3la r\xF3mai r\xF3wnie\u017C r\xF3\u017Cne r\xF3\u017Cnych r\xF4le r\xF4les r\xF4znych r\xF6misch r\xF6mische r\xF6mischen r\xF6vid r\xF8de r\xFAt r\u0103mas r\u0103zboi r\u016Fzn\xE9 r\u016Fzn\xFDch r\u01A1i r\u0259smi r\u1EA5t r\u1EAFn r\u1EB1ng r\u1ED3i r\u1ED9ng r\u1EDDi r\u1EEBng saa saab saada saakka saam saan saanud saanut saapui saat saattaa saavutti sababu sabagai sabe saber sabit sable sabor sabuah sabuak sac sacaro sacerdote sacerdotes sacra sacred sacrifice sad sada sadece sadr\u017Ei saeculo safe safety safle saga sagadang saged sageli sagen sagolsagol sagt sagte sah saha sahaja sahibi sahiji sahip sahiptir sai said saikua sail sailed sailing sailkatua sailkaturik sailkatuta sailkatutako sailkatzen saint sainte saints saison saisons sait saiu saivat saj saja sajandi sajandil sajeroning sajt sajtu saj\xE1t saka saking sakit sakop saksa saksalainen sakumna sal sala salah salary salas sale sales salida saling salir sali\xF3 salle salles salon salsa salt salto saltze salud saluran salut salute salva salvar salvare salvo sam sama samalla saman samana samantaro samarbeid samba samband same samego samej samen samenwerking samh\xE4lle samh\xE4llen samh\xE4llet sami samlede samlet samling samma samme sammen samo samolotu samolot\xF3w samom sampai samping sample samples sampun samt samtidig samtidigt samuti samym san sana sanat sand sang sangat sangen sanger sangre sangue sank sans sant santa santi santo santuario sant\xE9 sao sap sapere sapiens saranggo saranno sarebbe sarebbero sari sarja sarjan sarjassa sarrera sarta sartu sar\xE0 sastav sastava sastavu sastoji sastra sast\u0101v\u0101 sasuatu sat satele satelit satellite satellites sathidan satt satte satu satul satului satunya sat\xE9lite sau saudara sauf sausio saut sauver savann savanna savannskog savas sava\u015F save saved savet saveznih saveznoj saving savivaldyb\u0117je savivaldyb\u0117s savo savoir savu saw sawijining sawl saxophone say saya sayap sayesinde saying sayoknyo says sayti sayt\u0131ndan say\u0131 say\u0131da say\u0131m\u0131na say\u0131s\u0131 sazvije\u017E\u0111u sa\xDF sa\xEDda sa\xFAde sa\u011F sa\u011Flayan sa\u011Fl\u0131k scala scale scales scandal scattered scelta scelto scena scenario scene sceneggiatore sceneggiatura scenes schaffen schaffte schedule scheduled scheint scheiterte schema scheme schepen schied schildwespen schip schlie\xDFen schlie\xDFlich schlie\xDFt schloss schlug schnell scho scholar scholars scholarship schon school schools schreef schreibt schrieb schrijven schrijver schuf schwarz schwarze schwarzen schwedischen schwer schwere schweren sci science sciences scientific scientifica scientifico scientifique scientifiques scientist scientists scienza scienze scolaire scomparsa sconfitta sconfitto scontri scontro scoorde scope scoperta scoperto scopo scopre score scored scorer scores scoring scozzese screen screening screenplay screenwriter script scriptor scris scrisse scritta scritti scritto scrittore scrittura scrive scrivere scrutin sculpteur sculptor sculpture sculptures scultore scuola scuole sc\xE8ne sc\xE8nes sc\xE9nario sc\xE9nariste sea seal sealhulgas sean search seas season seasons seat seating seats sebab sebagai sebagian sebahagian sebanyak sebbene sebe sebelah sebelum sebelumnya sebenarnya sebesar sebi sebou sebuah sebutan sec seca secara seccion secci\xF3 secci\xF3n sech sechs sechsten seco secoli secolo secolul secolului second seconda secondaire secondaires secondary seconde secondes secondi secondo seconds secours secret secreta secretari secretario secretary secreto secrets secr\xE9taire secteur section sections sector sectores sectors secuencia secular secundaria secundum secure secured security sed seda sedam sedan sedang sedangkan sede sedengkeun sederhana sedert sedes sedikit seds see seed seeds seeing seej\xE4rel seek seeking seeks seem seemed seems seen sees sef seg segala segera segi segle segles segment segmento segments segna segno segon segona segones segons segretario segreto segue segueix seguente seguenti seguida seguido seguidores seguindo seguinte seguintes seguir seguire seguit seguito seguiu segun segunda segundo segundos segundu seguran\xE7a seguretat seguridad seguro seg\xEDts\xE9g\xE9vel seg\xFAn seg\xFCent seg\xFCents sehemu sehen sehingga sehr sei seien seier seigneur seigneurie seigneurs sein seinare seine seinem seinen seiner seines seinna seis seit seitdem seither seitsem\xE4n seize seized seizoen seizoenen seja sejak sejam sejarah sejenis sejumlah sekali sekaligus sekarang sekitar sekolah sekretarz seks sektor sekund sekunder sek\xE4 sel sela selain selalu selama selanjutnya selatan selben selbst selecci\xF3 selecci\xF3n select selected selection selepas selesai sele\xE7\xE3o self sell selle sellele selles sellest selling sello selo selon sels selskapet selten selu seluruh selv selva selve sem semaine semaines semakin semana semanas semasa sembla semble semblent sembra seme semelhante sementara semestre semi semiasse semiax\u0103 semifinal semifinale semifinalen semifinales semifinali semifinals semifin\xE1le sempat semplice semplicemente sempre semua semula sen senador senare senari\xF4 senator sencillo send sending sendiri sendo sends sendt sendte senere seng sengem senger senhor seni senior senjata seno sens sensa sense sensible sensitive senso sensor sensu sent sente sentence sentenced sentido sentiment sentiments sentir sentit sentral sentrale sentro sentrum sentyabr senyor senza sen\xF3n seo seorang seotud sepak sepanjang separa separaci\xF3n separada separado separados separat separate separated separately separation sepenuhnya seperti sept september septembra septembre septembrie septembril septembr\u012B septentrional septiembre septi\xE8me sequel sequence sequences sequenza sequ\xEAncia ser sera seraient serait seramai serangan serangga serata serbe serem seres seri seria serial serialu seriam serie serien series serii serija serije seriji sering serious seriously seri\xE1l seri\xE1lu seront serra sert serta servant serve served servei serveis server serves servi service services servicio servicios serviciu servidor serving servir servit serviu servizi servizio servi\xE7o servi\xE7os ser\xE0 ser\xE1 ser\xE1n ser\xEDa ser\xEDan ses seseorang sesi\xF3n sesongen sessanta session sessions sessuale sest sesto sestra sesuai sesuatu set sete setelah setembre setembro setempat setenta setiap setiembre setor sets sett settanta sette settembre settentrionale settimana settimane setting settings settle settled settlement settlements settlers settore setzen setzt setzte seu seua seul seule seulement seuls seun seura seuraavana seuran seurasi seurauksena seus seva seven seventh sever several severe severely severn\xED severu seves sex sexe sexo sexta sexto sexu sexual sexuelle sezione sezon sezona sezonas sezone sezoni sezonie sezonu sezonunda sezon\u0101 sez\xF3ny sez\xF3n\u011B se\xE7ildi se\xF1al se\xF1or sfida sf\xE2r\u0219itul shahar shahardir shall shallow shape shaped share shared shares sharing sharp she shed sheep sheet shek shell shells shelter shi shield shift shifted ship shipping ships shirt shkak shkurt shock shoot shooting shop shopping shops shore short shorter shortly shot shots should shoulder show showed showing shown shows shqiptar shqiptare shrom\xE1\u017Ed\u011Bn\xED shtatida shtator shu shum\xEB shuningdek shut sia siad siak siano siblings sic sicas\xED sice sicer sich sicher sicherte sichtbar sick sicurezza sid sida sidan side siden sider sides sidlakan sidlakang sido sidste sie sieben siebie sieci siedziba siedzib\u0105 siege sieglo sieglos sieglu siegte siehe sieht siell\xE4 siempre siempres sien siendo sierpnia sierpniu sierra siet siete sieu sifat sifatida sig sight sigla siglo siglos sign signal signals signature signe signed signes significa significado significance significant significantly significativa significativamente significativo significato signifie signing signora signore signs sign\xE9 sigue siguen sigui siguiendo siguiente siguientes siguieron sigui\xF3 siihen siin\xE4 siirrettiin siirtyi siis siiski siit\xE4 sijaan sijaitsee sijaitseva sijaitsevat sijalle sije\u010Dnja siji sijoittui sik sikeres siker\xFClt sikre siku sil sila sile silence silent sill\xE4 silnice silver sim simbol simbolo similaire similar similares similarly simile simili similis simple simplement simplemente simples simplesmente simplex simplified simply simulation simultaneously sin sina sinal since sind sindaco sinds sine sinema sinensis sing singel singer singers singing singl singla single singles singolare singoli singolo singular sinh sini sinistra sinistro sinn sinne sino sin\xF3 sin\xF3n sipas sip\xEBrfaqe sir siri sirve sirvi\xF3 sis sisi sispann sist sista siste sistem sistema sistemas sistemes sistemi sister sisters siswa sis\xE4lt\xE4\xE4 sit sita sitcom site siten sites siti sitio sitios sito sits sitt sittemmin sitten sitter sitting situ situa situaciones situaci\xF3 situaci\xF3n situada situado situat situata situated situatie situation situations situato situazione situa\xE7\xE3o situe situm situs situ\xE9 situ\xE9e situ\xE9es situ\xE9s sitye sit\xE4 sit\xFAa sive sivil six sixi\xE8me sixteen sixth sixty siya siyasi siyopans size sized sizes si\xE1 si\xE8cle si\xE8cles si\xE8ge si\xE8ges si\xEAu si\u0119 si\u0142 si\u0142y sjedi\u0161te sjeveru sju sj\xE4lv sj\xE4lva sj\xF6 sj\xF6arna sj\xF6n sj\xF6procent sj\xF8lv ska skal skala skalbaggsart skall sker sketch sketches ski skill skills skin skip skipet skjedde skladatel skladby skladu sklopu skog skogar skola skole skolen skon\u010Den\xED skon\u010Dil skon\u010Dila skoraj skoro skozi sko\xF0a\xF0 skreiv skrev skrevet skrift skrifter skrive skriven skriver skryf skuespiller skull skulle skupaj skupin skupina skupine skupinu skupiny skupin\u011B skupova skutek sky skyriaus sk\xE5despelare sk\u0142ad sk\u0142ada sk\u0142adu sk\u0142adzie slag slaget slags slakkensoort slalom slave slavery slaves slechts sleep slegs slekt slekten slide slightly slik slika slike sljede\u0107eg slo slog slogan sloot slope slopes slot slott slottet slou\u017E\xED slov slova slovenski slovensk\xFD slovo slow slowly sluipwespen sluit slut slutade slutet slutningen slutt sluttar slutten slu\u010Daju slu\u017Ebu slu\u017Eby slu\u017Ei sl\xE4kte sl\xE4ktet sl\xE4pptes sl\xE5 sl\xE5tt small smaller smallest smart smatra smatraju smerom smislu smo smoke smooth smrt smrti sm\xE5 sm\u011Brem sna snaga snage snail snake snart sna\u017E\xED snel snimljen snow soa soad soan soap sob soberan\xEDa sobie sobre sobretot sob\u0105 sob\u011B soccer soccerway sociais social sociale sociales sociali socialist socialista socialiste socialistes socials sociaux sociedad sociedade sociedades societat societies society societ\xE0 socio soci\xE1ln\xED soci\xE9t\xE9 soci\xE9t\xE9s socken sodan sodass sodium soe sofitu sofort sofreu soft software sog sogar sogenannte sogenannten soggetti soggetto sogno soi soient soil soins soir soir\xE9e soit soixante sok sokkal sol sola solaire solamente solar solare solares solaris solche solchen solcher sold soldado soldados soldat soldaten soldater soldati soldats soldier soldiers sole soleil solely solem solen soles solgt solgte soli solid solide solista solitamente solitario solito soll sollen sollte sollten solo solos sols soltanto solteres soluci\xF3n solution solutions soluzione solve som sombra some somente someone something sometimes somewhat somit sommaren somme sommeren sommet sommige soms son sona sonda sondern song songar songen songs songwriter sonido sono sonora sonore sonra sonradan sonraki sonras\u0131nda sons sonst sont sonucu sonucunda sonunda soo soon soort soorten soos sooth sopimuksen soporte sopra soprano soprattutto sor sora soratra sorella sorge sorgte soridalany sorolja sorozat sorpresa sort sorta sortant sorte sorti sortida sortie sortir sortu sortzen sor\xE1n sos sosial sosiale sostegno sostiene sostituito sosyal sot sota sotto sou soudn\xED sought souhaite soul sound sounds soundtrack source sources sous soutenir soutenu south southeast southeastern southern southwest southwestern soutien soutient sout\u011B\u017Ee sout\u011B\u017Ei souvenir souvent souverain sou\u010Dasnosti sou\u010Dasn\xE9 sou\u010D\xE1st sou\u010D\xE1st\xED sovietico sovint sovi\xE9tica sovi\xE9tico sovi\xE9ticos sovi\xE9tique sovjetiske sovrano sowat sowie sowjetischen sowohl soy soziale sozialen so\xE1t so\u1EA1n space spacecraft spaces spada spagnola spagnolo spalio spalle span spanischen spanners spanning spansk spanske spanyol spatial spazio speak speaker speakers speaking speaks specia special speciale speciali specialist specialized specialment specialmente specie species specific specifically specified specii specimen specimens spectacle spectacles spectateurs spectrum spedizione speech speed speeds speel speelde speelt spel spela spelade spelades spelar spelare spelat spelen speler spelers spelet spell spelled spelling spelt spelte spend spending spent spesad spesie spesielt spesies spesso spettacolo speziell spezielle sphere spider spiders spielen spielt spielte spielten spille spillede spiller spillere spillet spilt spilte spin spindelart spinnensoort spinneruilen spiral spiralna spire spirit spirito spiritual spisak spisovatel spisu spite split spojen\xED spoke spoken spole\u010Dnost spole\u010Dnosti spole\u010Dnost\xED spole\u010Dn\u011B spolo\u010Dnosti spolu spolupr\xE1ci spomenik spominje spons sponsor sponsored sponsspesie spoorlijn spor sport sportif sporting sportive sportivo sporto sportovn\xED sports sposa sposato spos\xF2 spos\xF3b spot spotkania spotkaniu spotka\u0144 spots spotted spozulo spo\u015Br\xF3d spp sprach sprake spraw sprawie spre spread sprechen spricht spring sprint sprog spr\xE1vy spr\xE5k spr\xE5ket spune sp\xE4ten sp\xE4ter sp\xE4tere sp\xE4teren sp\xE9cial sp\xE9ciale sp\xE9cialiste sp\xE9cialis\xE9e sp\xE9cifique sp\xE9cifiques sp\xED\u0161e sp\u0113les sp\u0113l\u0113 sp\u0119dzi\u0142 sqrt squad squadra squadre squadron square srbsko srebrny sredi\u0161ta sredi\u0161te srednje srednjoj srpna srpnja srpski ssa ssp ss\xE4 sta staa staaf staan staat staatliche staatlichen stabil stabile stability stable stacja stacji stad stade staden stadig stadio stadion stadionu stadium staff stage staged stages stagione stagioni stake stal stala stali stalo stammen stammer stammt stammte stampa stan stand standar standard standards standen standing stands stanica stanice stanici stanie stanja stanje stanju stanovnika stanovni\u0161tva stanovni\u0161tvo stanowi stanowiska stanowisko stanowisku stanowi\u0105 stanu stanza star starb starben stare stari stark starke starken starkt starost starp starred starring stars start starta startade started startede starten starter startet startete starting starts startu star\u0161\xED stasiun stasjon stat stata statale state stated statement statements staten states stati static stating station stationed stations statistical statistics statistiek statistik statistiku statistique statku stato statsminister statt stattdessen statua statue statues statul statului statunitense statunitensi status statut stav stava stavba stavby stavu stay stayed stazione stazioni sta\u0142 sta\u0142a sta\u0142o sta\u0142y stb steam sted steden steder stedet steeds steel steep stehen stehenden steht stejn\u011B stekelart stel stelde stella stelle stellen stellt stellte stellten stellvertretender stelt stem stemma stemme stemmen stemmer stenen step stepped steps ster stereo sterk sterke sterkt stessa stesse stessi stesso stets steun stick stieg stierf stiet stift stiftet stijl stil stile still stille stilling sto stock stod stof stoff stoji stoj\xED stolen stoletja stoletju stolet\xED stolicy stolje\u0107a stolje\u0107u stond stonden stone stones stood stop stopie\u0144 stopnia stopniu stopped stops stor stora storage store stored stores storia storica storici storico storie stories storm storo\u010Dia storo\u010D\xED stort story storyline stosunku str straal straalvinnige straat strada strade straight strain stran strana strand strane strange strani stranica stranice stranici stranka stranke stranu strany stran\u011B strategic strategies strategy strat\xE9gie strax streak stream streaming streams streek street streets streng strength stress stretch stretto strict strictly strid strijd strike striker strikes striking string strings strip strips stroje stroke strollad strong stronger strongly stronie strony stron\u0119 struck structural structure structures struggle struggled struktur struktura strukture struktury strumenti strumento struttura strutture strzeli\u0142 str\xE4cker stub studeerde studenog student studente studenti students studerade studerte studi studia studie studied studier studierte studies studii studija studio studioalbum studios studiosi studiowa\u0142 studiu studium studi\xF3w studoval study studying stuk stvari stycznia styczniu styl style stylem styles stylu styre styrke styrker st\xE0it st\xE1le st\xE1t st\xE1tn\xED st\xE1tu st\xE1ty st\xE1t\u016F st\xE4dsegr\xF6n st\xE4dtischen st\xE4ndig st\xE4ppklimat st\xE4rker st\xE5 st\xE5r st\xEAd st\xF6d st\xF6rre st\xF6rsta st\xF8rre st\xF8rrelse st\xF8rste st\xF8tte st\u0159edn\xED sua suara suas suatu sub suba subdivision subfamilia subfamily subir subit subito subject subjects submarine submitted subsequent subsequently subsidiary subsp subspecies subspecii substance substances substantial substituir substitute substitu\xEDdo subtropical subtropikal subtropiskt suburb suburban suburbs succeed succeeded succes success successeur successful successfully successi succession successione successiva successivamente successive successivement successivi successivo successo successor succ\xE8de succ\xE8s sucedido sucedi\xF3 sucesi\xF3n sucesor sucesso such sucre sud sudah sudaro sudden suddenly sudeste sudoeste sudul sue sueca sueco suele suelen suelo suerte sue\xF1o suffered suffering sufficient suffrages suficiente sufri\xF3 sugar sugas suggest suggested suggesting suggests sugli suhu sui suicide suis suisse suit suitable suite suites suivant suivante suivantes suivants suivent suivi suivie suivre sujet sujets sukces sukses suksess suku sul sull sulla sulle sullo sulod sultan sulu sum suma sumala sumber summary summer summit sun sung sungai sunnu sunt suo suoi suolo suom suomalainen suono suoraan supaya super supera superando superar superficial superficie superf\xECce superf\xEDcie superior superiore superiores superiori supervision suport supplement supplied supplies supply suppl\xE9mentaires support supported supporter supporters supporting supporto supports supposed suppression supra suprafa\u021B\u0103 sup\xE9rieur sup\xE9rieure sur sura surat sure sureste surface surfaces surge surgeon surgery surgiu suri surma suroeste surprise surrender surrendered surrounded surrounding surtout surveillance survey survival survive survived surviving survivors sus susceptible suskirstymo suspect suspected suspended suspension sustainable sustained sustav sustava sut suur suure suuren suuri suurin suv suy suya suyo suyos suyu su\xE9dois su\u1EA5t su\u1ED1t sva svake svaki svampar svampart svart svarte svat\xE9ho sve svedese svega svemiru svensk svenska svenske svet sveta svete svetovej svetovno svetu svezi svi svibnja svih svijeta svijetu sviluppato sviluppo svim svizzero svjetskog svo svog svoj svoje svojega svojej svojem svojho svoji svojich svojih svojim svojo svojoj svojom svoju svolge svolse svolta svolto svom svou sv\xE6rt sv\xE9 sv\xE9ho sv\xE9m sv\xFDch sv\xFDm sv\xFDmi sv\u011Bta sv\u011Btov\xE9 sv\u011Bt\u011B sv\u016Fj sweet swego swej swimming swing switch switched swoich swoim swoje swojego swojej swoj\u0105 sword sw\xF3j syahan syarikat syd sydd sydlig sydlige sydost sydv\xE4st sydv\xE4stra syd\xF6st syd\xF6stra symbol symbole symbols symptoms syn syna synagogue syndrome syne synem synes synonym syns synthesis synthesizer syntyi syntynyt systeem system systematic systematis systemet systems systemu syst\xE8me syst\xE8mes syst\xE9m syst\xE9mu sytuacji syv syyskuuta szabad szczeg\xF3lnie szczyt szef szefa szemben szeptember szerb szereg szerepel szerepelt szerepet szerepl\u0151 szerezte szerint szerk szerkeszt\u0151it szeroko\u015Bci szervezet szerzett szezon sze\u015Bciu sze\u015B\u0107 sziget szinte szint\xE9n szkole szko\u0142a szko\u0142y szko\u0142\u0119 szk\xF3\u0142 szlov\xE1k szovjet sztuk sztuki szybko sz\xE1m sz\xE1ma sz\xE1mos sz\xE1m\xE1ra sz\xE1m\xFA sz\xE1rmazik sz\xE1rmaz\xE1s\xFA sz\xE1rmaz\xF3 sz\xE1zad sz\xE1zadban sz\xE1zadi sz\xE9les sz\xEDn\xE9sz sz\xF3 sz\xF3cikk sz\xF3l\xF3 sz\xF6vets\xE9g sz\xFCks\xE9ges sz\xFCletett s\xE1ch s\xE1m s\xE1ng s\xE1t s\xE1u s\xE2n s\xE2u s\xE3o s\xE4ga s\xE4mtliche s\xE4rskilt s\xE4song s\xE4songen s\xE4tt s\xE4v s\xE5dan s\xE5dana s\xE5g s\xE5kalte s\xE5ledes s\xE5ng s\xE5som s\xE6rleg s\xE6rlig s\xE6son s\xE8gle s\xE8rie s\xE9culo s\xE9culos s\xE9curit\xE9 s\xE9jour s\xE9lection s\xE9lectionn\xE9 s\xE9lections s\xE9nateur s\xE9paration s\xE9r s\xE9rie s\xE9ries s\xECndich s\xEDa s\xEDdlo s\xEDmbolo s\xEDmbolos s\xEDndrome s\xEDnum s\xED\xF0an s\xED\xF0ar s\xF3lo s\xF3n s\xF3ng s\xF4ng s\xF6der s\xF6derut s\xF6dra s\xF6l s\xF6z s\xF8lv s\xF8n s\xF8nn s\xF8r s\xF8rlige s\xF8rvest s\xFAa s\xFAas s\xFAhvezd\xED s\xFAlurnar s\xFAng s\xFA\u010Dasnosti s\xFA\u010Das\u0165ou s\xFBnt s\xFCck s\xFCdlich s\xFCdlichen s\xFCdwestlich s\xFCd\xF6stlich s\xFCnd s\xFCndinud s\xFCndis s\xFCre s\xFCrfati s\u0101ka s\u0101kum\u0101 s\u0103i s\u0103n s\u0103u s\u0105jungos s\u0131k s\u0131ra s\u0131rada s\u0131ras\u0131nda s\u0142owa s\u0142u\u017Cby s\u0142u\u017Cb\u0119 s\u0142u\u017Cy\u0142 s\u0151t s\u0153ur s\u0153urs s\u0259b\u0259b s\u0259h s\u1EA3n s\u1EAFc s\u1EAFt s\u1EB5n s\u1ED1ng s\u1EDBm s\u1EE9c s\u1EEDa taal taas tab taba tabantuak tabel tabela taben tabla table tableau tableaux tables tacatat tackle tackles tactics tad tada tae tag tagasi tage taget tagja tagjai tagolong tahaka tahap tahta tahu tahun tai tail tailed taille taip tais taj taj\u0101 tak taka takaisin take taken takes taki takia takich takie taking takmer tako tako\u0111e tako\u0111er takrat taksonomiese tak\xE9 tak\u0131m tak\u0131m\u0131 tak\u017Ce tak\u017Ee tal tala talagsaon talatak talde tale talen talent talento talents tales talet talets tali talianu talk talking talks tall talla talle taller tallet talvez talvolta tal\xE1lhat\xF3 tam tamamen taman tamanho tama\xF1o tambahan tambi\xE9n tamb\xE9 tamb\xE9m tamin tami\xE9n tammikuussa tammikuuta tamo tampek tampil tampoco tam\xE9n tan tanah tanaman tanan tanben tanda tandis tanduak tanduk tangan tangga tanggal tango tank tanks tanom tanpa tanques tant tantang tante tanti tanto tantos tantu tanulm\xE1nyait tanult tany tan\xE0na tan\xE1r tao taon taona taong tap tapa tape tapi tapo tappa tapte tar taraf\u0131ndan tard tarde tardi tarea tareas tarehe target targeted targets tarihi tarihinde tarixi tarixind\u0259 tarixli tarkibiga tarkoittaa tarkoitus tarp tartalmaz tartj\xE1k tartom\xE1nyban tartott tartotta tartott\xE1k tartozik tartozott tartoz\xF3 tarybos tar\u0131m tas tasa tasca tashkil task tasks taste tastiere tat tato tats\xE4chlich tatt tat\u0103l tau taught taula taun taur\u0117s taux tavaliselt tavataan tavoin tavola tawo tax taxa taxdetails taxes taxi taxon taxonomic taxonomische taxonomy tay ta\u010Diau ta\u010Du ta\u015F\u0131mal\u0131 tch\xE8que tea teach teacher teachers teaching team teammate teams teater teatr teatral teatrale teatre teatri teatro teatru tech technical technique techniques technisch technische technischen technologie technologies technology teclado teclados tecnica tecniche tecnico tecnologia tecnolog\xEDa teda tedesca tedeschi tedesco tedy tee teen teeth tega tegen tegenover tegenstelling tegenwoordig tegi tegnet tego teh teha tehdy tehd\xE4 tehnika tehnyt tehsil tehtiin tehty teh\xE1t teil teils teilweise teine teise teiste teis\u0117s tej tejto tek teka tekanan teken tekende teki teknik teknologi tekrar teks tekshirilgan tekst teksten tekstu tel tela telah telde tele telebisyon telefon telenovela telephone telep\xFCl\xE9s telep\xFCl\xE9sen televisi televisie televisieserie television televisione televisiva televisivo televisi\xF3 televisi\xF3n televis\xE3o televizn\xED televizyon teljes teljesen tell telle telles telling tellingen tells telo tels telt tem tema teman temas temat tematikotik teme temel temes temi temp tempada tempat tempatan tempel temperatur temperatura temperaturas temperature temperatures temperatuur temperat\u016Bra tempererat tempi tempio temple temples templo templom temploma templos tempo tempoh temporada temporadas temporal temporarily temporary tempore tempos temps temp\xE9rature temsil temu tem\xE1tica ten tena tenaga tenan tenant tend tendance tende tendencia tender tendo tendr\xEDa tenen tenente tener tenere tenga tengah tenger tenggara tenha tenia tenido tenien teniendo teniente tenir tenis tennis tenor tension tensions tensi\xF3n tenta tentang tentar tentara tentativa tentative tentativo tente tentera tenth tento tentou tenu tenue tenure tenuta tenuto ten\xEDa ten\xEDan teolog teologi teologia teorema teori teoria teorie teorii teorija teorije teor\xEDa teor\xEDas tepat ter teraka terakhir terapia terbaik terbang terbentuk terbesar terbuka tercatat terceira terceiro tercer tercera tercero terdapat terdiri terem teren terenie terenu tereny teret\xF3re tereyn tergolong terhadap teria teritorija teritorijalne teritorijoje teritoriju teritorij\u0101 teritorinio teritoriul terjadi terkenal terlalu terletak terlibat terlihat term termasuk terme termen termes termin termina terminal terminando terminar termine termini terminou terminus termin\xE9 termin\xF3 termo termos terms term\xE9szetes terpilih terra terrain terrains terras terre terrein terremoto terreno terrenos terres terrestre terrestres terrestrial terrestribus terrible territoire territoires territori territorial territoriale territoriales territories territorio territorios territoris territoriu territory territ\xF2ri territ\xF3rio terror terrorism terrorist terrorista terr\xE4ngen tersebut tertentu tertinggi terug terus terutama terutamanya terwijl terwyl terytorium terza terzo ter\xE1 ter\xFClet ter\xFClete ter\xFCleten ter\xFClet\xE9n tesi tesis tesoro tespit test testa testament testamento teste tested testi testing testo tests testu teszi tetap tetapi tetor tett tette teu teulu teve tevens tewas text texte textes textile texto textos texts tez te\xF1en te\u010De te\u0161ko te\u017C tha thai tham than thanh thanks thao that thay the theartofpainting theater theaters theatre theatrical their them thema theme themes themselves then theo theology theorem theoretical theories theory therapy there thereafter thereby therefore thermal these thesis theta they thi thick thin thing things think thinking third thirteen thirty this thi\xEAn thi\u1EBFt thi\u1EBFu thi\u1EC7n thi\u1EC7t thi\u1EC7u those though thought thousand thousands tho\xE1t tho\u1EA1i thrash threat threatened threats three threw thriller throne through throughout throw throwing thrown thu thua thus thuy\u1EBFt thuy\u1EC1n thu\u1EADn thu\u1EADt thu\u1ED1c thu\u1ED9c th\xE0nh th\xE1c th\xE1i th\xE1inig th\xE1ng th\xE1nh th\xE1p th\xE2n th\xE8me th\xE8mes th\xE8se th\xE9ologie th\xE9orie th\xE9\xE2tre th\xEAm th\xEC th\xED th\xEDch th\xF4n th\xF4ng th\xF9 th\xFA th\xFAc th\u0103m th\u0103ng th\u01A1 th\u01B0 th\u01B0\u01A1ng th\u01B0\u1EDBc th\u01B0\u1EDDng th\u01B0\u1EDFng th\u01B0\u1EE3ng th\u1EA3o th\u1EA5p th\u1EA5t th\u1EA5y th\u1EA7n th\u1EADm th\u1EADp th\u1EADt th\u1EAFng th\u1EB3ng th\u1EBF th\u1EC3 th\u1ECB th\u1ECBt th\u1ED1ng th\u1ED5 th\u1EDD th\u1EDDi th\u1EE5 th\u1EE7 th\u1EE7y th\u1EE9 th\u1EE9c th\u1EEBa th\u1EED th\u1EF1c tiada tiba ticket tickets tid tida tidak tiden tider tidigare tidlegare tidlig tidlige tidligere tidspunkt tie tied tief tiek tiempo tiempos tiempu tien tienda tiende tiene tienen tient tier tierra tierras tiers ties tieto tie\u017E tiga tige tight tigre tih tiid tiilan tij tijd tijdens tijdschrift tijekom tijela tijelo tik tika tikai tikrinta til tilbage tilbake tildelt tilh\xF8rer tilknyttet till tillbaka tillegg tillh\xF6r tillh\xF6rde tillsammans tilsvarende tim timber timbre time timer times timoun timp timpul timur tin tina tinatawag tindakan ting tingga tinggal tinggi tingkat tinh tinha tinham tio tip tipa tipe tipi tipicamente tipico tipli tipo tipos tipu tipus tir tira tire tiro tissue tisztelet\xE9re tis\xEDc titel titeln titik title titled titles titlul titolare titoli titolo titre titres tittelen titul titulada titulado titulaire titular titulu tiveram tivo ti\xEAn ti\xEAu ti\xF1a ti\u1EBFn ti\u1EBFng ti\u1EBFp ti\u1EBFt ti\u1EC1n ti\u1EC3u ti\u1EC7n tjeneste tjera tjer\xEB tjet\xEBr tlak toa toate toat\u0103 tobacco toca tocando tocar toch toda todas todav\xEDa today todo todos tod\u0117l toe toegepast toegevoegd toen toenmalige toeran toerana toernooi tog toga together togs toho tohoto tohto toi toile toimi toimii toiminta toiminut toimivat toimus toinen toiseksi toisen toit toj tok tokoh tokom toku tol tola told toles toliko tolkning toll tolos tolv tom toma tomada tomado tomando tomar tomaron tomb tomba tombe tome tomonidan tomou tomto tomu tom\xF3 tom\u0113r ton tona tone toneladas tongue tonnes tono tons too took tool tools toont top topic topics toplam topo topographic topon topped toppen top\xE4d toren torn torna tornado tornando tornar tornare torneio torneo torneos torno tornou torn\xF2 torpedo torraste torre torrente torres torture tos tot tota totaal total totala totale totalement totalidad totalit\xE9 totally totalmente totalt totdat totes toti\u017E toto tots tou touch touchdown touchdowns toujours toukokuuta toun tour toured touring tourism tourisme tourist tourists tournage tournament tournaments tourne tournoi tourn\xE9 tourn\xE9e tours tous tout toute toutefois toutes tov\xE1bb tov\xE1bbi tov\xE1bbra tov\xE1bb\xE1 toward towards tower towers town towns township toy to\xE0n to\xE1n tra trabaja trabajadores trabajando trabajar trabajo trabajos trabaj\xF3 trabalhar trabalho trabalhos trabalhou traballo trabayu tracce traccia trace traces track tracking tracks tracta tractament tractat trac\xE9 trad trade traded tradicionais tradicional tradicionales tradicionalmente tradiciones tradici\xF3 tradici\xF3n trading tradisi tradisional tradition traditional traditionally traditionell traditionelle traditionellen traditionnel traditionnelle traditions tradizionale tradizionali tradizione tradi\xE7\xE3o traducci\xF3n traduction traduit traduzione traf traffic traffico trafic trafikkmeldingar trafi\u0142 tragedia tragen trai trail trailer trails train trained trainer training trains trait traite traitement traits trait\xE9 traje trakcie trakten tram trama tramite tramo trams tramway trang tranh trans transaction transcription transfer transferred transfert transform transforma transformaci\xF3n transformar transformation transformed transf\xE9r\xE9 transici\xF3n transit transition translated translation translations translator transmisi\xF3n transmission transmiss\xE3o transparent transport transportation transporte transported transports trao trap tras trasa trasferimento trasferisce trasferito trasfer\xEC traslad\xF3 traslladar trasmessa trasmesso trasmissione trasporto trasy trat trata trataba tratado tratados tratamento tratamiento tratar traten trati tratta trattamento trattato tratti tratto trauma travail travaille travailler travailleurs travaill\xE9 travaux travel traveled traveling travelled travelling travels travers traverse travers\xE9e travi\xE9s travnja trav\xE9s trayectoria tra\u0165 tre treat treated treatment treaty treba treball treballar treballs trebuie trece trecut tredje tree trees treffen treh trei treinador treinta treize tren trend trends trener trenera trenes treni treno trenta trente trenutku trenutno tres tresnetako treten tre\u0107i tri trial trials triangle triangular tribal tribe tribes tribu tribunal tribus tributary tribute tributo trib\xF9 trick tried tries trifft trije trilha trim trio trip triple trips tripulaci\xF3n triste tritt triunfo tri\u1EC1u tri\u1EC3n tri\u1EC7u tro troba trobar trobat troben troca troch troepen trofeo trois troisi\xE8me trok trolig trombone trommer tron tronco trong trono tronu troops trop tropas tropes trophy tropical tropicales tropisch tropper troppo tror tross trots trotz trouble troubles troupe troupes trouvait trouve trouvent trouver trouv\xE9 trouwde trova trovano trovare trovato trovava trov\xF2 truck trucks true trug truly trummor trumpet trung trupa truppe trust truth truy truy\u1EC1n truy\u1EC7n try trying trzech trzeci trzy tr\xE0o tr\xE1ch tr\xE1fico tr\xE1i tr\xE1nh tr\xE4gt tr\xE8s tr\xE9s tr\xEAn tr\xEAs tr\xEC tr\xECnh tr\xED tr\xEDch tr\xF2 tr\xF2n tr\xF3a tr\xF4ne tr\xF9ng tr\xFA tr\xFAc tr\u012Bs tr\u01B0ng tr\u01B0\u1EDBc tr\u01B0\u1EDDng tr\u01B0\u1EDFng tr\u1EA1i tr\u1EA1ng tr\u1EA3 tr\u1EA3i tr\u1EA5n tr\u1EADn tr\u1EAFng tr\u1EBB tr\u1ECB tr\u1ECDng tr\u1ED3ng tr\u1EDDi tr\u1EDF tr\u1EE3 tr\u1EE5 tr\u1EE5c tr\u1EEB tr\u1EEF tr\u1EF1c tsar tsjerke tsjin tsunami tsy tua tube tuberculosis tubes tubig tubo tubuah tubuh tud tudi tudo tudom\xE1nyos tudott tudta tuer tugas tuig tujuan tujuh tuleb tulee tuli tulisan tullut tumani tumba tumbuh tumbuhan tumor tun tune tung tunggal tunnel tunnels tunnetaan tunnettu tuntud tuo tuolloin tur turbine turbo turc turca turco turcos turi turismo turkumidagi turli turn turnaj turned turneringen turniej turnieju turning turno turns turn\xE9 turn\xEA turun turut tur\u0117jo tusken tussen tutaj tutela tuto tutta tuttavia tutte tutti tutto tuttora tuvieron tuvo tuy tuy\xEAn tuy\u1EBFn tuy\u1EC3n tuy\u1EC7t tu\xE9 tu\xE9s tu\u1EA7n tu\u1ED5i tvar tvaru tvo\u0159\xED tv\xE5 tv\xE5hj\xE4rtbladig tv\xE5vingeart twa twaalf twee tweede tweevleugelige twelve twentieth twenty twice twin twintig two txertatu tych tyd tydens tyder tylko tym tym\u017Ce typ type typen typer types typical typically typisch typische typisk typu typy tyre tys tysi\u0119cy tysk tyska tyske tyto tytu\u0142 tytu\u0142em tytu\u0142u ty\xF6skenteli tzv tzw t\xE0i t\xE0n t\xE0u t\xE1c t\xE1ch t\xE1i t\xE1n t\xE1rsadalmi t\xE2m t\xE2rziu t\xE2y t\xE3o t\xE4glich t\xE4hendab t\xE4m\xE4 t\xE4m\xE4n t\xE4nav t\xE4tbefolkat t\xE4tig t\xE4t\xE4 t\xE4ysin t\xE6t t\xE8cnica t\xE9cnica t\xE9cnicas t\xE9cnico t\xE9cnicos t\xE9h t\xE9ho\u017E t\xE9lescope t\xE9l\xE9film t\xE9l\xE9spectateurs t\xE9l\xE9vision t\xE9l\xE9vis\xE9e t\xE9m\u011B\u0159 t\xE9r t\xE9rmino t\xE9rminos t\xE9rminu t\xE9to t\xE9\u017E t\xEAm t\xEAn t\xEAte t\xEBscht t\xECm t\xECnh t\xEDch t\xEDm t\xEDma t\xEDn t\xEDnh t\xEDo t\xEDpica t\xEDpico t\xEDpus\xFA t\xEDtol t\xEDtulo t\xEDtulos t\xEDtulu t\xEDz t\xF2a t\xF3k t\xF3l t\xF4i t\xF4n t\xF4t t\xF5ttu t\xF6bb t\xF6bbek t\xF6bbi t\xF6bbsz\xF6r t\xF6lt\xF6tt t\xF6rt\xE9nelmi t\xF6rt\xE9net t\xF6rt\xE9nete t\xF6rt\xE9nt t\xF6rt\xE9n\u0151 t\xF6r\xF6k t\xF6\xF6tas t\xFAl t\xFAnel t\xFCm t\xFCr t\xFCrk t\xFCrkischen t\xFDchto t\xFDm t\xFDmu t\u0101s t\u0103ng t\u011Bchto t\u0151l t\u0159eba t\u0159et\xED t\u0159i t\u0159\xED t\u0159\xEDdy t\u016Bkst t\u01B0\u01A1ng t\u01B0\u1EDBc t\u01B0\u1EDBng t\u01B0\u1EDFng t\u01B0\u1EE3ng t\u0259hsil t\u0259min t\u0259msil t\u0259qdim t\u0259r\u0259find\u0259n t\u0259svir t\u0259yin t\u0259\u015Fkil t\u1EA1i t\u1EA1m t\u1EA1o t\u1EA1p t\u1EA3i t\u1EA5n t\u1EA5t t\u1EA7m t\u1EA7ng t\u1EADn t\u1EADp t\u1EAFc t\u1EAFt t\u1EB7ng t\u1EC9nh t\u1ECBch t\u1ED1c t\u1ED1i t\u1ED1ng t\u1ED1t t\u1ED3n t\u1ED5ng t\u1ED9c t\u1ED9i t\u1EDBi t\u1EE5c t\u1EE9c t\u1EEBng uainishaji uang ubi ubica ubicaci\xF3n ubicada ubicado ubos ubrzo uccelli uccidere ucciso uchder uchun ucrainean\u0103 uczelni uczestniczy\u0142 udalerri udalerria udalerrian udalerrien udalerriko udaljena udaljenost udara uda\u0142o udde uden udgav udgave udgivet udzia\u0142 udzia\u0142em udzia\u0142u ufficiale ufficiali ufficialmente ufficio uga ugahon ugi uglavnom ugljenika uglovnih ugovor ugyanis uilen uit uiteindelijk uitgebracht uitgebreid uitgegeven uitgevoerd uitgezonden ukaza\u0142 ukazuje uklju\u010Duje uklju\u010Duju\u0107i uko\u0144czeniu uko\u0144czy\u0142 ukr ukrcensus ukupno ukuran uk\u0142ad uk\u0142adu ulan ulang ular ula\u015F\u0131m\u0131 ulic ulica ulice ulici ulicy ulike uloga ulogu ulohan ulohang ulozi ulterior ulteriore ulteriori ulteriormente ultima ultimate ultimately ultime ultimi ultimo ultra ului uluslararas\u0131 uma umana umane umani umano umat umbenannt umbes umbral umetnosti umfangreiche umfasst umfasste umgebaut umgeben umgesetzt umgewandelt umjesto umjetnosti umogon umo\u017E\u0148uje umro ums umum umumiy umumnya umumnyo umur um\u011Bn\xED una unabh\xE4ngig unable unan unang unas unbekannt uncertain uncle unclear uncredited und undang unde under underarter undergraduate underground underlying understand understanding understood undertaken underwent undir une unei unele unes ung unga ungarischen unge ungef\xE4hr ungef\xE4r ungherese unha uni unica unico unidad unidade unidades unie uniform uniforme unii unik unika unincorporated uning union unione unions unipersonals unique uniquement unir unirse unit unitat unitate unitatibus unitats unitatum united units unity unit\xE0 unit\xE9 unit\xE9s univers universal universale universe universelle universidad universidade universidades universitaire universitaires universitaria universitario universiteit universitet universitetet universiteto universities university universit\xE0 universit\xE9 universit\xE9s universo univerzity univerzit\u011B uni\xF3 uni\xF3n unknown unless unlike unlikely unmittelbar unner uno unor unos uns unsuccessful unsuccessfully unsur unten unter unteren untergebracht unterhalb unterlag unternahm unterrichtete unterscheiden unterscheidet unterschieden unterschiedlich unterschiedliche unterschiedlichen unterschrieb unterstellt unterst\xFCtzen unterst\xFCtzt unterst\xFCtzte untersucht unterteilt until untuak untuk unu unui unul unusual unutar unveiled uomini uomo upacara upang upaya upcoming update updated upgrade upgraded upon uporablja upp uppe upper uppf\xF6rdes uppgick uppstr\xF6ms upravno upravo ups upset up\u0117s ura uralkod\xF3 uranium uransa urbain urbaine urban urbana urbano urbanos urbe urbeto urbo urbs urdd urednik uri urkundlich url urma urmare urmat urm\u0103 urodzi\u0142 urriaren ursprung ursprungligen urspr\xFCnglich urspr\xFCngliche urspr\xFCnglichen urtarrilaren urte urtean urteko urz\u0105d usa usada usadas usado usados usage usaha usan usando usar usare usata usati usato uscire uscita uscito usc\xEC use used useful usein useita user users uses usia usine using uska uso usos uspio uspjeh usque ustanova ustiategi usu usual usually usualmente usuario usuarios usw utakmica utakmice utakmici utama utamanya utamo utamonyo utan utanas utanf\xF6r utara utawa utawi utbredningsomr\xE5de utbredt utca ute uten utenfor utgitt utgjorde utgj\xF8r utg\xF6r utifr\xE5n utile utilisant utilisation utilise utilisent utiliser utilis\xE9 utilis\xE9e utilis\xE9es utilis\xE9s utility utilitza utilitzar utilitzat utiliza utilizada utilizadas utilizado utilizados utilizan utilizando utilizar utilizza utilizzando utilizzare utilizzata utilizzati utilizzato utilizzo utiliz\xF3 utk\xE1n\xED utnevnt utols\xF3 utstr\xE4ckningen utvide utviklet utvikling utworu utwory utworzono utwor\xF3w utw\xF3r utzi ut\xE1n ut\xF3bbi uudelleen uuden uue uur uusi uusia uutta uvijek uv\xE1d\xED uwagi uwag\u0119 uygun uzakl\u0131ktad\u0131r uzun uzunlu\u011Fu uzyska\u0142 uzyska\u0142a u\u010Dili\u0161ta u\u017E\u0117m\u0117 vaak vaan vacances vacant vacante vad vader vaga vague vagy vagyis vahel vai vaid vaikka vain vainqueur vair\u0101k vaisseau vaixells vakarus vakar\u0173 val valamint valasotik vald valde valdes vale valet valeur valeurs valg valget valgt valgte valid valida valiti valittiin vall valla vallas valle vallen valley vall\xE9e valmis valmistui valodik valodo valor valore valores valori valors valsts valstyb\u0117s valt valtion valuable value valued values valuma valve val\xF3 val\xF3sz\xEDn\u0171leg van vanaf vand vandens vandt vanlig vanligvis vann vannak vanno vant vantaggio vanuit vanwege vapeur vapor var vara varandra varav vard\u0131 vard\u0131r vare varem varen vari varia variabile variable variables variansen variant variante variantes variants varias variation variations varie varied variedad variedade variedades varierad varierer varies varieties variety variet\xE0 varios various varit vari\xE9t\xE9 varje varmaste varmt varrella vars vart varten varv vary varying var\xF0 vas vasario vasi vasit\u0259sil\u0259 vast vasta vastaan vaste vastgesteld vasto vastu vas\xFAtvonal vas\xFAt\xE1llom\xE1s vat vatn vaton vatten vattendrag vattenk\xE4llor vattenytor vattnet vaut vaxt vecchia vecchio veces vechi vecinos vector ved vede veden\xED veden\xEDm vedere vedl vedno vedouc\xED veebruar veebruaril veel veg vegada vegades vegaes vegetal vegetation vegna vegvesen vehicle vehicles veh\xEDculo veh\xEDculos vei veido veien veigan veik\u0117jas veille veinte veio vej vek veka veku vel vela veld vele velho velik velika velike veliki velikih velikim veliko velikog velikosti veliku velja\u010De velkou velk\xE9 velk\xFD velmi velocidad velocidade velocitat velocity velocit\xE0 vem ven venant vencedor vencer venceu vend venda vendar vendas vende vender vendido vendita vendi\xF3 vendosur vendre vendte vendu venduto vene venendo vengono venir veniva venivano venne venner vennero venstre vent venta ventas vente ventes venti vento ventre vents venture venue venues veoma ver vera veral verano verantwoordelijk verantwortlich verb verbal verband verbindet verbinding verbo verbonden verboten verbrachte verbreitet verbunden verda verdad verdade verdadera verdadero verde verdeeld verden verdens verdenskrig verder verdere verdes verdi verdi\u011Fi vere veren vereniging verfasst verfasste verfolgt verf\xFCgt verf\xFCgte vergeben verhaal verhaftet verhalen verheiratet verhindern verhuisde veri verildi verilen verilir verir verit\xE0 veri\xF0 verjetno verk verkauft verkaufte verket verkiezingen verkocht verkoop verkozen verksam verksamhet verlassen verlaten verleden verlegt verletzt verlief verliehen verliet verlie\xDF verloop verloor verlor verloren verl\xE4ngert verl\xE4uft vermeld vermelho vermutet vermutlich vernoemd vero verpflichtet verre verr\xE0 vers versant versato verscheen verschenen verschiedene verschiedenen verschiedener verschil verschillende verse versehen verses versetzt versi versie versio version versione versiones versioni versions versi\xF3 versi\xF3n versjon verskeie verso versos verstarb verst\xE4rkt versucht versuchte versus vers\xE3o vers\xF5es vert vertaald vertaling verte verteilt vertelt vertical verticale vertrat vertreten vertrieben vertrok verurteilt vervangen vervolgens verwenden verwendet verwendete verwendeten verwijst very verze verzeichnet verzi verzija ver\xE3o ver\xE4ndert ver\xF6ffentlicht ver\xF6ffentlichte ver\xF6ffentlichten ver\u0259n vescovi vescovo vesnice vessel vessels vest veste vestiges vestlige vet veteran veterans veto vett vette vettura vet\xEBm veu veure veut veuve veya vez veza\xF1 veze vezes vezetett vezette vezet\u0151 vezet\u0151je vezi ve\u0107 ve\u0107e ve\u0107i ve\u0107ina ve\u0107inom ve\u010D ve\u010Dinoma ve\u013Ekos\u0165 ve\u013Emi vgl via viac viagem viaggio viajar viaje viajes viaj\xF3 viatge viaxe via\u021Ba via\u021B\u0103 vice vicenda vicende vicepresidente vicina vicinity vicino victim victime victimes victims victoire victoires victoria victorias victories victory vict\xF2ria vid vida vidare vidas vide video videoclip videogioco videojuego videos videre vides videt\xFC vidi vid\xE9o vie vieille viejo viel viele vielen vieler vielleicht viel\xE4 vien viena vienas viene viennent viens vient viento vienu vien\u0105 vier vierde vierte vierten vieta vietans vietas vietoje vietos vietu viet\u0101 viet\u0105 vieux view viewed viewers views vigor vigueur viimeinen viis viisi vijeka vijeku vijf vijfde vik viktig viktigaste viktige viktigste vil vila vilatge vile vilka vilken vilket vill villa village villages villaggio ville villes vil\xE1g vil\xE1gbajnoks\xE1gon vil\xE1gh\xE1bor\xFA vin vince vincendo vincere vincitore vind vinde vinden vindt vingt vino vins vinse vint vinta vinte vinteren vinto vinyl vio viola violation violence violencia violent violenta violenza violin violino violon vir viral viri viridis virtual virtually virus vis visa visage visant visar visas vise viser visi visibile visible visibles visine visini vision visione visit visita visitante visitantes visitar visite visited visiteurs visiting visitors visits visi\xF3n viso visoko viss vissa visse vissensoort vissza visszat\xE9rt vist vista vistas viste visto visu visual visuomen\u0117s viszont vis\xE3o vit vita vital vitamin vitamina vite vitesse vitet viteve viti vitin vitit vitro vittima vittime vittoria vittorie vit\xF3ria viu viure viva vivant vive viven vivent vivere vivien viviendas vivint vivir vivis vivi\xF3 vivo vivos vivre viz vi\xEAn vi\xF0 vi\u0146a vi\u0146u vi\u0146\u0161 vi\u0161e vi\u1EBFt vi\u1EC7c vi\u1EC7n vjerojatno vjerski vjet vlada vladavine vlade vlag vlak vlasenko vlast vlasti vlastn\xED vliegensoort vliesvleugelig vliesvleugeligen vlinder vliv vloaz vlogo vl\xE1da vl\xE1dy vocais vocal vocale vocales vocalist vocalista vocals vocation voce voces voci voc\xEA voda vode vodi vodn\xED vodu vody voe voeren voet voetbal voetballer vogel voi voice voiced voices void voida voidaan voie voient voies voir voire voisine voisins voit voittanut voitti voitto voiture voitures voivat voix vojensk\xE9 vojna vojne vojni vojnika vojno vojny vojska vojske vojsko vojsku vok vokal vokie\u010Di\u0173 voksne vokste vol volante volb\xE1ch volcanic voler volgde volgen volgende volgens volgt voli volk volkstelling voll volle volledig volledige volley volleyball vollst\xE4ndig volna volo volont\xE0 volont\xE9 vols volt volta voltage voltak voltant voltar volte volto voltou volum volume volumen volumes volumi voluntad volunteer volunteers volver volvi\xF3 vol\xFAmenes vom vomas voms von vond vonden voneinander vont von\xEB voo voor vooral voorbeeld voordat voorheen voorkomen voormalig voormalige voornamelijk voort voorzien voorzitter vor vora vorbei vorbitoare vorbitori vore vorgesehen vorgestellt vorhanden vorhandenen vorher vorige vorm vormde vormen vormt vorte voru vorwiegend vos vote voted voter voters votes voti votik voting voto votos voulait vous voyage voyages voyageurs voye voz vozila vo\xEFvodie vraag vrai vraiment vrata vratio vra\u0107a vrch vrchol vrcholu vreme vremena vrh vrhu vriend vrienden vrij vrije vrijednosti vrijeme vrijwel vrlo vro vroeg vroege vroeger vrouw vrouwelijke vrouwen vrsta vrste vr\xE1tane vr\xE1til vse vseh vsi vua vue vuelo vuelos vuelta vuelve vui vuit vulgaris vulnerable vum vun vundet vunnet vuodelta vuoden vuodesta vuoksi vuole vuonna vuosien vuosina vuoteen vuotiaana vuotiaiden vuotta vuxna vu\xF4ng vya vydal vydala vyd\xE1n\xED vyhr\xE1l vyko vyskytuje vysok\xE9 vytvo\u0159il vy\u0161\u0161\xED vznikl vznikla vzniklo vzniku vznik\xE1 v\xE0i v\xE0ng v\xE0nh v\xE0o v\xE1lasztott\xE1k v\xE1lce v\xE1lky v\xE1logatott v\xE1lt v\xE1ltozat v\xE1ltozat\xE1nak v\xE1ltozott v\xE1ltoz\xE1sa v\xE1r v\xE1rias v\xE1rios v\xE1rmegye v\xE1ros v\xE1rosban v\xE1rosi v\xE1rost v\xE2rsta v\xE2y v\xE3o v\xE4g v\xE4ga v\xE4lill\xE4 v\xE4lja v\xE4rlden v\xE4rldens v\xE4rldskriget v\xE4ster v\xE4sterut v\xE4stlig v\xE4stra v\xE4xer v\xE4xtart v\xE4xter v\xE4xtlighet v\xE5r v\xE5ren v\xE6re v\xE6ret v\xE6rt v\xE9ase v\xE9cu v\xE9gezte v\xE9gzett v\xE9g\xE9n v\xE9g\xFCl v\xE9hicule v\xE9hicules v\xE9ritable v\xE9rit\xE9 v\xEDa v\xEDas v\xEDce v\xEDctima v\xEDctimas v\xEDdeo v\xEDdeos v\xEDt\u011Bzstv\xED v\xEDz v\xF2ng v\xF5i v\xF5ib v\xF5imalik v\xF5itis v\xF5ivad v\xF5ttis v\xF6llig v\xF6r v\xF9ng v\xFDboru v\xFDchod v\xFDchodn\xED v\xFDkon v\xFDrazn\u011B v\xFDrobu v\xFDroby v\xFDvoj v\xFDznam v\xFDznamn\xE9 v\xFD\u0161ce v\u0101cu v\u0103n v\u010Detn\u011B v\u010Faka v\u0113l v\u0113l\u0101k v\u0117l v\u0117liau v\u011Bku v\u011Bnoval v\u011Bt\u0161ina v\u011Bt\u0161inou v\u011Bt\u0161\xED v\u0161ak v\u0161ech v\u0161echny v\u0161etky v\u0161etk\xFDch v\u016Fbec v\u016F\u010Di v\u017Edy v\u01B0\u01A1ng v\u01B0\u1EE3t v\u0259fat v\u1EA5n v\u1EABn v\u1EADn v\u1EADt v\u1EADy v\u1ECDng v\u1ED1n v\u1EDBi v\u1EEBa v\u1EF1c waar waarbij waard waarde waarden waardoor waarin waarmee waarna waaronder waarop waarschijnlijk waarvan waarvoor wadi wagon wahrscheinlich wait waiting wakati wakazi wake wakil waktu wala walang walaupun walce walk walki walking walks wall walls walog wandte wanita wanneer want wanted wants wapatao wapen war ward ware waren warfare warga warm warna warning warrt wars warto\u015Bci was wasemaji wasn waste wat watak watch watched watching water waters watu wave waves way ways wchodzi wcze\u015Bniej wead weak wealth wealthy weapon weapons wear wearing weather web webgunea webgunean webgunetitik website websites wechselte wedder wedding weder wedi wedstrijd wedstrijden wed\u0142ug week weekend weekly weeks weer weern wees weet wefan weg wegen wegens wei weight weil weinig weisen weist weit weiter weitere weiteren weiterer weiteres weiterhin weitgehend wei\xDF wei\xDFe wei\xDFen weken wel welche welchem welcher welches welfare welke well weltweit wengi wenig wenige wenigen weniger wenn went wer werd werde werden were wereld werk werken werkt werkte wersja wersji wesentlich weshalb west westen western westlich westliche westlichen wet weten wetenschappelijk wetenschappelijke wetenskaplike wewengkon what whatever wheat wheel wheels when where whereas whether which while whilst white who whole whom whose why wia wichtig wichtige wichtigen wichtiger wichtigste wichtigsten wickets wide widely wider widespread widmete widow width wie wieder wiederholt wiederum wiek wieku wiele wielko\u015Bci wielu wiene wies wie\u015B wife wijk wijze wikang wiki wikipedia wil wilaya wilayah wild wilde wildlife will willen willing win wind window windows winds wine wing wings wingspan winnaar winnen winner winners winning wins winter wir wird wire wireless wirkt wirkte wirtschaftliche wirtschaftlichen wis wisata wise wish wishes wissenschaftliche wissenschaftlichen wissenschaftlicher wist wit with withdraw withdrawal withdrawn withdrew within without witness witnesses witte wiwit wi\u0119c wi\u0119cej wi\u0119kszo\u015Bci wi\u0119kszo\u015B\u0107 wkr\xF3tce woa woan wobec wobei wodurch wody wohl woj wojew\xF3dztwa wojew\xF3dztwie wojnie wojny wojsk wojska wojskowy wokal wok\xF3\u0142 wol wollen wollte wollten woman women womit won wonen wong wonten wood wooden woonde woord woorden word worden words wordt wore work worked worker workers working works workshop workshops world worldtimezone worldwide worm worn worrn worse worship worst worth wos wou would wound wounded wp\u0142yw wraz wrestler wrestling write writer writers writes writing writings written wrong wrote wrth wrze\u015Bnia wrze\u015Bniu wr\xF3ci\u0142 wschodniej wsch\xF3d wsi wsp\xF3lnie wsp\xF3\u0142pracy wst\u0105pi\u0142 wszed\u0142 wszystkich wszystkie wszystkim wtedy wuchs wujud wur wurde wurden wurdt wurk wurr wurrn www wybodaeth wyborach wybrany wybuchu wyd wydana wydanie wydany wyda\u0142 wygranym wygra\u0142 wyjecha\u0142 wynik wyniki wynikiem wyniku wynosi wynosi\u0142a wysoko\u015Bci wysoko\u015B\u0107 wyspie wyspy wyst\u0105pi\u0142 wyst\u0119powa\u0142 wyst\u0119puje wyst\u0119puj\u0105 wyst\u0119puj\u0105cy wywalczy\u0142 wy\u0142\u0105cznie wy\u015Bcigu wzd\u0142u\u017C wzgl\u0119dem wzgl\u0119du wzi\u0105\u0142 w\xE4chst w\xE4hlte w\xE4hrend w\xE4re w\xE9i w\xEAreld w\xF3wczas w\xFCrde w\xFCrden w\u0142adz w\u0142adze w\u0142adzy w\u0142adz\u0119 w\u0142a\u015Bnie w\u0142oski w\u015Br\xF3d xalq xan xaneiro xanh xarici xarxa xefe xeito xem xeneral xente xeral xin xineru xogador xuegu xullo xunetu xung xunto xuntu xunu xuy\xEAn xu\xF1o xu\u1EA5t xu\u1ED1ng x\xE1c x\xE2m x\xE2y x\xE9nero x\xE9neru x\xE9t x\xFAc x\xFCsusi x\u01B0a x\u01B0\u01A1ng x\u0259rit\u0259si x\u1EA3y x\u1EBFp yaitu yake yakla\u015F\u0131k yakni yak\u0131n yaln\u0131z yana yana\u015F\u0131 yang yangi yani yanvar yan\u0131 yan\u0131nda yao yapan yapm\u0131\u015F yapm\u0131\u015Ft\u0131r yapt\u0131 yapt\u0131\u011F\u0131 yap\u0131lan yap\u0131lm\u0131\u015Ft\u0131r yap\u0131m\u0131 yard yards yard\u0131m yari yar\u0131 yax\u0131n yax\u015F\u0131 yayg\u0131n yay\u0131n yay\u0131nlanan yazar yazd\u0131\u011F\u0131 ya\u015F ya\u015Fad\u0131\u011F\u0131 ya\u015Fayan ya\u015Fay\u0131\u015F ya\u015F\u0131nda yderligere ydy year years yela yellow yels yeni yeniden yenid\u0259n yenye yer yera yerel yeren yeri yerida yerine yerini yerin\u0259 yerle\u015Fim yerli yerl\u0259\u015Fir yerl\u0259\u015F\u0259n yet yeux yezh yezho\xF9 yfir yhden yhdess\xE4 yhdysvaltalainen yhteens\xE4 yhteydess\xE4 yhti\xF6n yhtye yhtyeen yht\xE4 yh\xE4 yield yil yilda yildan yillarda yine yirik yksi yleens\xE4 yli yliopiston yliopistossa yma ymhellach yng yngre yok yoki yoktur yol yolu yon yos you young younger youngest your youth youtube ypa\u010D yra ystod yta ytan ytterligare yulduz yuqori yuta y\xE8n y\xEAu y\xF6n\xFCnde y\xFCksek y\xFCks\u0259k y\xFCzy\u0131lda y\u0131l y\u0131lda y\u0131llarda y\u0131llar\u0131 y\u0131llar\u0131nda y\u0131ll\u0131k y\u0131l\u0131 y\u0131l\u0131na y\u0131l\u0131nda y\u0131l\u0131ndan y\u1EBFu zabytk\xF3w zachodniej zach\xF3d zacz\u0105\u0142 zadebiutowa\u0142 zadnjih zag zagranicznych zagra\u0142 zahlreiche zahlreichen zahrani\u010D\xED zahrnuje zaidi zajednice zajedno zajmowa\u0142 zajmuje zajmuj\u0105c zaj\u0105\u0142 zaj\u0119\u0142a zaken zakon zakona zakonu zako\u0144czeniu zako\u0144czy\u0142 zakresie zakresu zal zale\u017Cno\u015Bci zalo\u017Een zalo\u017Eena zalo\u017Eil zaludnienia zaman zamanda zaman\u0131 zamieszkiwa\u0142o zamieszkiwa\u0142y zamku zang zanger zangeres zapadu zapo\u010Deo zapravo zaradi zar\xF3wno zast\u0119pca zat zati zatim zato zat\xEDmco zava zavatra zavod zavodu zavr\u0161io zawiera zawodach zawodnik zawodnikiem zawodnik\xF3w zawod\xF3w zawsze zazwyczaj za\u010Dal za\u010Dala za\u010Dali za\u010Dalo za\u010Del za\u010Dela za\u010Detku za\u010Diatku za\u010Dne za\u010D\xE1tku za\u0142o\u017Cony za\u0142o\u017Cy\u0142 za\u0159\xEDzen\xED za\u015B zbog zbor zbudowany zbyt zcela zde zdobywaj\u0105c zdoby\u0142 zdoby\u0142a zee zeeniveau zeer zeggen zegoen zehar zehatzak zehn zeigen zeigt zeigte zein zeitweise zejm\xE9na zeker zela zelf zelfs zelo zemalja zemes zemi zemljama zemlje zemlji zem\xED zem\xEDch zem\u011B zem\u0159el zen zena zenbait zenei zenekar zentrale zentralen zerbitzu zero zerrenda zerst\xF6rt zes zesde zespole zespo\u0142em zespo\u0142u zespo\u0142\xF3w zesp\xF3\u0142 zette zetten zeuden zeven zgodnie zgrade zhruba zich zichligi zichzelf zie ziehen zieht ziemi zien ziet zif zij zijde zijn zile zil\xE4k zin zinc zio zion zioten ziren zit zitten zituen zituzten zlato zmar\u0142 zmian zmiany zm\xEDnka zna znaczenie znacznie znajdowa\u0142 znajduje znajduj\u0105 znajduj\u0105ca znak znalaz\u0142 znamen\xE1 znan znana znane znanosti znanstvenih znany znatno zna\u010Di zniesionej znovu zn\xE1my zn\xE1m\xFD zoals zobrazuje zodat zog zogen zogenaamde zom zomer zon zona zonas zonder zone zones zon\u0103 zoo zoon zostaje zostali zosta\u0107 zosta\u0142 zosta\u0142a zosta\u0142o zosta\u0142y zou zouden zove zowel zp\u011Bt zp\u011Bv zp\u016Fsobem zraka zsid\xF3 zua zudem zuen zuerst zufolge zugelassen zugeordnet zugleich zugunsten zug\xE4nglich zuidelijke zuiden zuletzt zullen zum zumeist zumindest zunehmend zun\xE4chst zur zurginak zur\xFCck zusammen zusammengefasst zust\xE4ndig zus\xE4tzlich zus\xE4tzliche zuten zuvor zvijezda zvije\u017E\u0111u zvolen zwaar zwar zware zwart zwarte zwei zweier zweimal zweite zweiten zweiter zweites zwierz\u0105t zwischen zwi\u0105zane zwi\u0105zany zwi\u0105zanych zwi\u0105zek zwi\u0105zkowym zwi\u0105zku zwyci\u0119stwo zwykle zw\xF6lf zw\u0142aszcza zye z\xE1kladn\xED z\xE1klad\u011B z\xE1kon z\xE1kona z\xE1mek z\xE1mku z\xE1padn\xED z\xE1pas z\xE1pasy z\xE1rove\u0148 z\xE1\u0159\xED z\xE4hlen z\xE4hlt z\xE4hlte z\xE4nedo z\xEDskal z\xEDskala z\u0142oty z\u0159ejm\u011B \xE0lbum \xE0mbit \xE0rab \xE0rea \xE0ti \xE0w\u1ECDn \xE1cido \xE1gua \xE1guas \xE1it \xE1lbum \xE1lbumes \xE1lbuns \xE1ll \xE1llam \xE1llami \xE1lland\xF3 \xE1llt \xE1ll\xF3 \xE1ltal \xE1ltal\xE1ban \xE1ltal\xE1nos \xE1mbito \xE1nh \xE1prilis \xE1ra \xE1rabe \xE1rabes \xE1rbol \xE1rboles \xE1rea \xE1reas \xE1ri\xF0 \xE1tomos \xE1\xF0ur \xE2ge \xE2g\xE9 \xE2me \xE4binon \xE4binons \xE4bin\xE4don \xE4bin\xE4dons \xE4dabinoms \xE4dabinons \xE4dabin\xF6l \xE4fomons \xE4hnlich \xE4hnliche \xE4kenin\xFCkons \xE4kobol\xF6d\xF6l \xE4laboms \xE4labons \xE4ldre \xE4ldsta \xE4lifons \xE4ltere \xE4lteren \xE4lteste \xE4ltesten \xE4l\xF6dons \xE4l\xF6d\xF6lis \xE4nderte \xE4nnu \xE4ra \xE4rtv\xE4xtart \xE4rtv\xE4xter \xE4soel\xF6l \xE4u\xDFeren \xE4u\xDFerst \xE4ven \xE5lder \xE5pnet \xE5ra \xE5ren \xE5rene \xE5ret \xE5rets \xE5rhundrede \xE5rlig \xE5rs \xE5rsnederb\xF6rd \xE5tta \xE5tte \xE6ldste \xE7al\u0131\u015Fan \xE7al\u0131\u015Ft\u0131 \xE7al\u0131\u015F\u0131r \xE7do \xE7e\u015Fitli \xE7ocuk \xE7ok \xE7ox \xE7o\u011Fu \xE7\u0103\u043B\u043A\u0443\xE7\u0440\u0430\u043D \xE7\u0131kan \xE7\u0131kt\u0131 \xE7\u0131x\u0131\u015F \xE7\u0443\u043B\u0442\u0430 \xE7\u0443\u043B\u0445\u0438 \xE7\u0443\u0442\xE7\u0430\u043D\u0442\u0430\u043B\u0103\u043A \xE7\u044B\u043D \xE7\u044B\u0440\u0430\u043D\u0115\u043F\u0435 \xE8poca \xE8ra \xE8ran \xE8re \xE8sser \xE8xit \xE9cart \xE9change \xE9changes \xE9chapper \xE9chec \xE9chelle \xE9cliptique \xE9cole \xE9coles \xE9conomie \xE9conomique \xE9conomiques \xE9cran \xE9crire \xE9crit \xE9crite \xE9crits \xE9criture \xE9crivain \xE9crivains \xE9difice \xE9diteur \xE9dition \xE9ditions \xE9dit\xE9 \xE9ducation \xE9galement \xE9galit\xE9 \xE9glise \xE9glises \xE9ischt \xE9lection \xE9lections \xE9lectricit\xE9 \xE9lectrique \xE9lectronique \xE9let \xE9lete \xE9let\xE9t \xE9levage \xE9levait \xE9lev\xE9 \xE9lev\xE9e \xE9lite \xE9lt \xE9lu \xE9lus \xE9l\xE8ve \xE9l\xE8ves \xE9l\xE9ment \xE9l\xE9ments \xE9l\u0151 \xE9mission \xE9missions \xE9nek \xE9nergie \xE9pisode \xE9pisodes \xE9poca \xE9pocas \xE9ponyme \xE9poque \xE9pouse \xE9poux \xE9ppen \xE9preuve \xE9preuves \xE9p\xEDtett\xE9k \xE9p\xFClet \xE9p\xFClt \xE9quilibre \xE9quipage \xE9quipe \xE9quipements \xE9quipes \xE9quivalent \xE9rdek\xE9ben \xE9rkezett \xE9rt \xE9rte \xE9situ \xE9sser \xE9sta \xE9ste \xE9stos \xE9szaki \xE9ta \xE9tabli \xE9tablie \xE9tablir \xE9tablissement \xE9tablissements \xE9tablit \xE9tage \xE9tages \xE9taient \xE9tait \xE9tant \xE9tape \xE9tapes \xE9tat \xE9tats \xE9tend \xE9toile \xE9toiles \xE9tranger \xE9trangers \xE9trang\xE8res \xE9tude \xE9tudes \xE9tudiant \xE9tudiants \xE9tudie \xE9tudier \xE9tudi\xE9 \xE9t\xE9 \xE9vben \xE9vek \xE9vekben \xE9ves \xE9vi \xE9vig \xE9viter \xE9voluant \xE9volue \xE9volution \xE9voque \xE9vvel \xE9v\xE9nement \xE9v\xE9nements \xE9v\xEAque \xE9xito \xE9xitos \xE9\xE9n \xEAtre \xEBnner \xEBsht\xEB \xECgb\xE0j\xE1 \xEDgy \xEDndice \xEDrt \xEDrta \xEDr\xF3 \xEEle \xEEles \xEEmpotriva \xEEmpreun\u0103 \xEEnainte \xEEncepe \xEEnceput \xEEnceputul \xEEncep\xE2nd \xEEnclina\u021Bie \xEEnc\u0103 \xEEns\u0103 \xEEntr \xEEntre \xEE\u0219i \xF2ganizasyon \xF2pera \xF3leo \xF3pera \xF3rbita \xF3rdenes \xF3rgano \xF3rganos \xF3ta \xF4ng \xF5petaja \xF5ppis \xF6ar \xF6ffentlich \xF6ffentliche \xF6ffentlichen \xF6kenklimat \xF6ld \xF6l\xE7\xFCl\xFC \xF6nce \xF6nceki \xF6nemli \xF6n\xE1ll\xF3 \xF6ppet \xF6rtlichen \xF6ssze \xF6sszes \xF6sszesen \xF6st \xF6ster \xF6sterreichische \xF6sterreichischen \xF6sterreichischer \xF6sterut \xF6stlich \xF6stlichen \xF6stra \xF6ver \xF6vers\xE4ttning \xF6vriga \xF6vrigt \xF6zel \xF6zellikle \xF8en \xF8konomi \xF8konomisk \xF8konomiske \xF8nsket \xF8st \xF8stlige \xF8verste \xF8vrige \xF8ya \xFAdol\xED \xFAgy \xFAgynevezett \xFAjabb \xFAjra \xFAltim \xFAltima \xFAltimas \xFAltimo \xFAltimos \xFAnic \xFAnica \xFAnicamente \xFAnico \xFAnicos \xFAnicu \xFAnora \xFArovni \xFAtil \xFAzem\xED \xFBnder \xFCber \xFCbergeben \xFCberhaupt \xFCberliefert \xFCbernahm \xFCbernehmen \xFCbernommen \xFCbersetzt \xFCbertragen \xFCberwiegend \xFCblich \xFCblichen \xFCbrigen \xFChe \xFCks \xFCle \xFClke \xFClkenin \xFCmber \xFCmumi \xFCnl\xFC \xFCnner \xFCst \xFCyesi \xFCzere \xFCzerinde \xFCzerinden \xFCzerine \xFCzr\u0259 \xFCzv\xFC \xFCz\xFCnd\u0259 \xFCz\u0259rind\u0259 \xFC\xE7\xFCn \xFC\xE7\xFCnc\xFC \xFEann \xFEar \xFEau \xFEa\xF0 \xFEegar \xFEeim \xFEeir \xFEeirra \xFEess \xFEv\xED \u010Dak \u010Das \u010Dasa \u010Dase \u010Dasopis \u010Dasopisa \u010Dasopisu \u010Dasti \u010Dasto \u010Dasu \u010Das\u0165 \u010Dega \u010Dele \u010Delu \u010Demer \u010Dempionatas \u010Dempion\u0101t\u0101 \u010Demu \u010Dervence \u010Dervna \u010Dervnu \u010Desky \u010Desk\xE1 \u010Desk\xE9 \u010Desk\xE9ho \u010Desk\xFD \u010Desk\xFDch \u010Desto \u010Detiri \u010Dia \u010Dija \u010Dije \u010Diji \u010Dime \u010Din \u010Dine \u010Dini \u010Dinnost \u010Dinnosti \u010Din\xED \u010Dlan \u010Dlanak \u010Dlanov \u010Dlanova \u010Dlanovi \u010Dlen \u010Dlenem \u010Dlen\u016F \u010Dlov\u011Bka \u010Dovjek \u010Dovjeka \u010Dty\u0159i \u010D\xE1st \u010D\xE1ste\u010Dn\u011B \u010D\xE1sti \u010D\xE1st\xED \u010D\xEDm \u010D\xEDm\u017E \u010D\xEDslo \u010Falej \u010Fal\u0161ie \u010Fal\u0161\xEDch \u0111ai \u0111ang \u0111au \u0111em \u0111en \u0111i\u1EC1u \u0111i\u1EC3m \u0111i\u1EC3n \u0111i\u1EC7n \u0111o\xE0n \u0111o\xE1n \u0111o\u1EA1n \u0111u\xF4i \u0111u\u1ED5i \u0111\xE0i \u0111\xE0n \u0111\xE0o \u0111\xE1ng \u0111\xE1nh \u0111\xE1p \u0111\xE2y \u0111\xEAm \u0111\xECnh \u0111\xEDch \u0111\xF3ng \u0111\xF4i \u0111\xF4ng \u0111\xFAng \u0111\u0103ng \u0111\u0129a \u0111\u01A1n \u0111\u01B0a \u0111\u01B0\u01A1ng \u0111\u01B0\u1EDDng \u0111\u01B0\u1EE3c \u0111\u1EA1i \u0111\u1EA1n \u0111\u1EA1o \u0111\u1EA1t \u0111\u1EA3m \u0111\u1EA3ng \u0111\u1EA3o \u0111\u1EA5t \u0111\u1EA5u \u0111\u1EA7u \u0111\u1EA7y \u0111\u1EA9y \u0111\u1EB3ng \u0111\u1EB7c \u0111\u1EB7t \u0111\u1EB9p \u0111\u1EBFn \u0111\u1EC1n \u0111\u1EC1u \u0111\u1EC9nh \u0111\u1ECBa \u0111\u1ECBch \u0111\u1ECBnh \u0111\u1ECDc \u0111\u1ED1c \u0111\u1ED1i \u0111\u1ED3ng \u0111\u1ED5i \u0111\u1ED9c \u0111\u1ED9i \u0111\u1ED9ng \u0111\u1ED9t \u0111\u1EDBi \u0111\u1EDDi \u0111\u1EE9ng \u0123ints \u012Fkurta \u012Fkurtas \u012Fvyko \u013Coti \u013Eud\xED \u0142ac \u0142\u0105cznie \u0151ket \u0153il \u0153uvre \u0153uvres \u0159ada \u0159adu \u0159ady \u0159eky \u0159e\u0161en\xED \u0159\xE1du \u0159\xEDjna \u0159\xEDjnu \u0159\xEDzen\xED \u0159\xED\u0161e \u015Bmierci \u015Bmier\u0107 \u015Bpiew \u015Bredniej \u015Brodowiska \u015Bwiat \u015Bwiata \u015Bwiatowej \u015Bwiecie \u015Bwi\u0105tyni \u015Fair \u015Fark\u0131 \u015Febekesi \u015Fehir \u015Fehirdir \u015Fehri \u015Fehrin \u015Fekilde \u015Feklinde \u015Fey \u015Fimal \u015Fubesi \u015F\u0259h\u0259r \u015F\u0259h\u0259ri \u015F\u0259h\u0259rind\u0259 \u015F\u0259kild\u0259 \u015F\u0259kill\u0259r \u0161aha \u0161alies \u0161eimos \u0161est \u0161esti \u0161iaur\u0117s \u0161iaur\u0119 \u0161ifru \u0161ios \u0161is \u0161kola \u0161kole \u0161kolu \u0161koly \u0161tevilo \u0161to \u016Bdens \u016Bkio \u017Ar\xF3de\u0142 \u017Ar\xF3d\u0142a \u017Cona \u017Cony \u017Con\u0105 \u017Co\u0142nierzy \u017Cycia \u017Cycie \u017Cyciu \u017Eanra \u017Eelezni\u010Dn\xED \u017Eeli \u017Eem\u0117s \u017Een \u017Eena \u017Eene \u017Eeny \u017Eien \u017Eije \u017Eil \u017Eilo \u017Einynas \u017Eive \u017Eivelo \u017Eivi \u017Eivjelo \u017Eivljenja \u017Eivot \u017Eivota \u017Eivotu \u017Emoni\u0173 \u017Emon\u0117s \u017Eodynas \u017Eupanija \u017Eupanije \u017Eupaniji \u017E\xE1dn\xE9 \u01B0\u01A1ng \u01B0\u1EDBc \u021Bar\u0103 \u021B\u0103ri \u0259halinin \u0259halisi \u0259hat\u0259 \u0259lav\u0259 \u0259ld\u0259 \u0259m\u0259l\u0259 \u0259razi \u0259razisind\u0259 \u0259rzind\u0259 \u0259sas \u0259sas\u0131nda \u0259sas\u0259n \u0259srd\u0259 \u0259srin \u0259vv\u0259l \u03AC\u03BB\u03BB\u03B1 \u03AC\u03BB\u03BB\u03B5\u03C2 \u03AC\u03BB\u03BB\u03B7 \u03AC\u03BB\u03BB\u03BF \u03AC\u03BB\u03BB\u03BF\u03C5\u03C2 \u03AC\u03BB\u03BB\u03C9\u03BD \u03AC\u03BB\u03BC\u03C0\u03BF\u03C5\u03BC \u03AC\u03C1\u03C7\u03B9\u03C3\u03B5 \u03AC\u03C4\u03BF\u03BC\u03B1 \u03AD\u03B3\u03B9\u03BD\u03B1\u03BD \u03AD\u03B3\u03B9\u03BD\u03B5 \u03AD\u03B4\u03C1\u03B1 \u03AD\u03B4\u03C9\u03C3\u03B5 \u03AD\u03BA\u03B1\u03BD\u03B5 \u03AD\u03BA\u03B4\u03BF\u03C3\u03B7 \u03AD\u03BA\u03C4\u03B1\u03C3\u03B7 \u03AD\u03BB\u03B1\u03B2\u03B5 \u03AD\u03BD\u03B1 \u03AD\u03BD\u03B1\u03BD \u03AD\u03BD\u03B1\u03C2 \u03AD\u03BE\u03B9 \u03AD\u03C0\u03B5\u03B9\u03C4\u03B1 \u03AD\u03C1\u03B3\u03B1 \u03AD\u03C1\u03B3\u03BF \u03AD\u03C4\u03BF\u03C2 \u03AD\u03C4\u03C3\u03B9 \u03AD\u03C7\u03B5\u03B9 \u03AD\u03C7\u03BF\u03C5\u03BD \u03AD\u03C9\u03C2 \u03AE\u03B4\u03B7 \u03AE\u03C4\u03B1\u03BD \u03AF\u03B4\u03B9\u03B1 \u03AF\u03B4\u03B9\u03BF \u03AF\u03B4\u03B9\u03BF\u03C2 \u03B1\u03B3\u03CE\u03BD\u03B1 \u03B1\u03B3\u03CE\u03BD\u03B5\u03C2 \u03B1\u03B9\u03CE\u03BD\u03B1 \u03B1\u03BA\u03CC\u03BC\u03B1 \u03B1\u03BA\u03CC\u03BC\u03B7 \u03B1\u03BB\u03BB\u03AC \u03B1\u03BD\u03AC\u03BC\u03B5\u03C3\u03B1 \u03B1\u03BD\u03AC\u03C0\u03C4\u03C5\u03BE\u03B7 \u03B1\u03BD\u03AD\u03BB\u03B1\u03B2\u03B5 \u03B1\u03BD\u03AE\u03BA\u03B5\u03B9 \u03B1\u03BD\u03B1\u03C6\u03AD\u03C1\u03B5\u03B9 \u03B1\u03BD\u03B1\u03C6\u03AD\u03C1\u03B5\u03C4\u03B1\u03B9 \u03B1\u03C0\u03BF\u03B3\u03C1\u03B1\u03C6\u03AE \u03B1\u03C0\u03BF\u03C4\u03AD\u03BB\u03B5\u03C3\u03BC\u03B1 \u03B1\u03C0\u03BF\u03C4\u03B5\u03BB\u03B5\u03AF \u03B1\u03C0\u03BF\u03C4\u03B5\u03BB\u03B5\u03AF\u03C4\u03B1\u03B9 \u03B1\u03C0\u03BF\u03C4\u03B5\u03BB\u03BF\u03CD\u03BD \u03B1\u03C0\u03CC \u03B1\u03C0\u03CC\u03C3\u03C4\u03B1\u03C3\u03B7 \u03B1\u03C1\u03B3\u03CC\u03C4\u03B5\u03C1\u03B1 \u03B1\u03C1\u03B9\u03B8\u03BC\u03CC \u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 \u03B1\u03C1\u03BA\u03B5\u03C4\u03AC \u03B1\u03C1\u03C7\u03AD\u03C2 \u03B1\u03C1\u03C7\u03AE \u03B1\u03C1\u03C7\u03B9\u03BA\u03AC \u03B1\u03C5\u03C4\u03AC \u03B1\u03C5\u03C4\u03AD\u03C2 \u03B1\u03C5\u03C4\u03AE \u03B1\u03C5\u03C4\u03AE\u03BD \u03B1\u03C5\u03C4\u03AE\u03C2 \u03B1\u03C5\u03C4\u03BF\u03CD \u03B1\u03C5\u03C4\u03CC \u03B1\u03C5\u03C4\u03CC\u03BD \u03B1\u03C5\u03C4\u03CC\u03C2 \u03B1\u03C5\u03C4\u03CE\u03BD \u03B1\u03C6\u03BF\u03CD \u03B2\u03AC\u03C3\u03B7 \u03B2\u03B1\u03B8\u03BC\u03CC \u03B2\u03B1\u03C3\u03B9\u03BB\u03B9\u03AC \u03B2\u03B1\u03C3\u03B9\u03BB\u03B9\u03AC\u03C2 \u03B2\u03B9\u03B2\u03BB\u03AF\u03BF \u03B2\u03C1\u03AF\u03C3\u03BA\u03B5\u03C4\u03B1\u03B9 \u03B2\u03C1\u03AF\u03C3\u03BA\u03BF\u03BD\u03C4\u03B1\u03B9 \u03B2\u03C1\u03B9\u03C3\u03BA\u03CC\u03C4\u03B1\u03BD \u03B2\u03CC\u03C1\u03B5\u03B9\u03B1 \u03B3\u03AF\u03BD\u03B5\u03B9 \u03B3\u03AF\u03BD\u03B5\u03C4\u03B1\u03B9 \u03B3\u03B5\u03B3\u03BF\u03BD\u03CC\u03C2 \u03B3\u03B5\u03BD\u03BD\u03AE\u03B8\u03B7\u03BA\u03B5 \u03B3\u03B9\u03B1 \u03B3\u03B9\u03B1\u03C4\u03AF \u03B3\u03B9\u03BF\u03C2 \u03B3\u03BB\u03CE\u03C3\u03C3\u03B1 \u03B3\u03BD\u03C9\u03C3\u03C4\u03AE \u03B3\u03BD\u03C9\u03C3\u03C4\u03CC \u03B3\u03BD\u03C9\u03C3\u03C4\u03CC\u03C2 \u03B3\u03CD\u03C1\u03C9 \u03B4\u03B5\u03BA\u03B1\u03B5\u03C4\u03AF\u03B1 \u03B4\u03B5\u03BA\u03B1\u03B5\u03C4\u03AF\u03B1\u03C2 \u03B4\u03B5\u03BD \u03B4\u03B5\u03CD\u03C4\u03B5\u03C1\u03B7 \u03B4\u03B5\u03CD\u03C4\u03B5\u03C1\u03BF \u03B4\u03B7\u03BB\u03B1\u03B4\u03AE \u03B4\u03B7\u03BC\u03B9\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1 \u03B4\u03B9\u03AC\u03C1\u03BA\u03B5\u03B9\u03B1 \u03B4\u03B9\u03AC\u03C3\u03C4\u03B7\u03BC\u03B1 \u03B4\u03B9\u03AC\u03C6\u03BF\u03C1\u03B1 \u03B4\u03B9\u03AC\u03C6\u03BF\u03C1\u03B5\u03C2 \u03B4\u03C5\u03BD\u03AC\u03BC\u03B5\u03B9\u03C2 \u03B4\u03C5\u03BF \u03B4\u03CD\u03BD\u03B1\u03BC\u03B7 \u03B4\u03CD\u03BF \u03B5\u03AF\u03B4\u03B7 \u03B5\u03AF\u03B4\u03BF\u03C2 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B5\u03AF\u03C4\u03B5 \u03B5\u03AF\u03C7\u03B1\u03BD \u03B5\u03AF\u03C7\u03B5 \u03B5\u03BA\u03B1\u03C4\u03BF\u03BC\u03BC\u03CD\u03C1\u03B9\u03B1 \u03B5\u03BA\u03B5\u03AF \u03B5\u03BA\u03B5\u03AF\u03BD\u03B7 \u03B5\u03BA\u03BB\u03BF\u03B3\u03AD\u03C2 \u03B5\u03BA\u03C4\u03CC\u03C2 \u03B5\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE \u03B5\u03BD\u03B1\u03BD\u03C4\u03AF\u03BF\u03BD \u03B5\u03BD\u03C4\u03CC\u03C2 \u03B5\u03BD\u03CC\u03C2 \u03B5\u03BD\u03CE \u03B5\u03BE\u03AE\u03C2 \u03B5\u03C0\u03AD\u03C3\u03C4\u03C1\u03B5\u03C8\u03B5 \u03B5\u03C0\u03AF \u03B5\u03C0\u03AF\u03C0\u03B5\u03B4\u03BF \u03B5\u03C0\u03AF\u03C3\u03B7\u03C2 \u03B5\u03C0\u03B1\u03C1\u03C7\u03AF\u03B1 \u03B5\u03C0\u03B5\u03B9\u03B4\u03AE \u03B5\u03C0\u03B9\u03C4\u03C5\u03C7\u03AF\u03B1 \u03B5\u03C0\u03BF\u03C7\u03AE \u03B5\u03C0\u03BF\u03C7\u03AE\u03C2 \u03B5\u03C0\u03CC\u03BC\u03B5\u03BD\u03B7 \u03B5\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1 \u03B5\u03C4\u03CE\u03BD \u03B6\u03C9\u03AE \u03B6\u03C9\u03AE\u03C2 \u03B7\u03BB\u03B9\u03BA\u03AF\u03B1 \u03B8\u03AC\u03BD\u03B1\u03C4\u03BF \u03B8\u03AD\u03C3\u03B7 \u03B8\u03B5\u03C9\u03C1\u03B5\u03AF\u03C4\u03B1\u03B9 \u03B9\u03B4\u03B9\u03B1\u03AF\u03C4\u03B5\u03C1\u03B1 \u03B9\u03B4\u03C1\u03CD\u03B8\u03B7\u03BA\u03B5 \u03B9\u03C3\u03C4\u03BF\u03C1\u03AF\u03B1 \u03BA\u03AC\u03B8\u03B5 \u03BA\u03AC\u03BD\u03B5\u03B9 \u03BA\u03AC\u03C0\u03BF\u03B9\u03B1 \u03BA\u03AC\u03C4\u03B9 \u03BA\u03AC\u03C4\u03BF\u03B9\u03BA\u03BF\u03B9 \u03BA\u03AC\u03C4\u03C9 \u03BA\u03AD\u03BD\u03C4\u03C1\u03BF \u03BA\u03AD\u03C1\u03B4\u03B9\u03C3\u03B5 \u03BA\u03B1\u03B8\u03CE\u03C2 \u03BA\u03B1\u03B9 \u03BA\u03B1\u03C4\u03AC \u03BA\u03B1\u03C4\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7 \u03BA\u03B1\u03C4\u03AC\u03C6\u03B5\u03C1\u03B5 \u03BA\u03B1\u03C4\u03AD\u03BA\u03C4\u03B7\u03C3\u03B5 \u03BA\u03B1\u03C4\u03B1\u03C3\u03BA\u03B5\u03C5\u03AE \u03BA\u03B1\u03C4\u03B7\u03B3\u03BF\u03C1\u03AF\u03B1 \u03BA\u03B1\u03C4\u03BF\u03AF\u03BA\u03BF\u03C5\u03C2 \u03BA\u03B1\u1F76 \u03BA\u03BF\u03BD\u03C4\u03AC \u03BA\u03C5\u03B2\u03AD\u03C1\u03BD\u03B7\u03C3\u03B7 \u03BA\u03C5\u03BA\u03BB\u03BF\u03C6\u03CC\u03C1\u03B7\u03C3\u03B5 \u03BA\u03C5\u03C1\u03AF\u03C9\u03C2 \u03BA\u03CC\u03C1\u03B7 \u03BA\u03CC\u03C3\u03BC\u03BF \u03BB\u03AF\u03B3\u03BF \u03BB\u03CC\u03B3\u03C9 \u03BC\u03AC\u03C7\u03B7 \u03BC\u03AD\u03B3\u03B5\u03B8\u03BF\u03C2 \u03BC\u03AD\u03BB\u03B7 \u03BC\u03AD\u03BB\u03BF\u03C2 \u03BC\u03AD\u03C1\u03BF\u03C2 \u03BC\u03AD\u03C3\u03B1 \u03BC\u03AD\u03C3\u03C9 \u03BC\u03AD\u03C4\u03C1\u03B1 \u03BC\u03AD\u03C7\u03C1\u03B9 \u03BC\u03AE\u03BA\u03BF\u03C2 \u03BC\u03AE\u03BD\u03B5\u03C2 \u03BC\u03AF\u03B1 \u03BC\u03B1\u03B6\u03AF \u03BC\u03B1\u03C2 \u03BC\u03B5\u03B3\u03AC\u03BB\u03B5\u03C2 \u03BC\u03B5\u03B3\u03AC\u03BB\u03B7 \u03BC\u03B5\u03B3\u03AC\u03BB\u03BF \u03BC\u03B5\u03B3\u03B1\u03BB\u03CD\u03C4\u03B5\u03C1\u03B7 \u03BC\u03B5\u03B3\u03B1\u03BB\u03CD\u03C4\u03B5\u03C1\u03BF \u03BC\u03B5\u03C4\u03AC \u03BC\u03B5\u03C4\u03B1\u03BE\u03CD \u03BC\u03B7\u03BD \u03BC\u03B7\u03C4\u03AD\u03C1\u03B1 \u03BC\u03B9\u03B1 \u03BC\u03B9\u03B1\u03C2 \u03BC\u03B9\u03BA\u03C1\u03AE \u03BC\u03B9\u03BA\u03C1\u03CC \u03BC\u03BF\u03C1\u03C6\u03AE \u03BC\u03BF\u03C5 \u03BC\u03BF\u03C5\u03C3\u03B9\u03BA\u03AE \u03BC\u03C0\u03BF\u03C1\u03B5\u03AF \u03BC\u03C0\u03BF\u03C1\u03BF\u03CD\u03BD \u03BC\u03C0\u03BF\u03C1\u03BF\u03CD\u03C3\u03B5 \u03BC\u03CC\u03BB\u03B9\u03C2 \u03BC\u03CC\u03BD\u03BF \u03BD\u03AD\u03B1 \u03BD\u03AD\u03BF \u03BD\u03AF\u03BA\u03B7 \u03BD\u03B7\u03C3\u03AF \u03BD\u03C4\u03B5 \u03BD\u03CC\u03C4\u03B9\u03B1 \u03BE\u03B5\u03BA\u03AF\u03BD\u03B7\u03C3\u03B5 \u03BF\u03B9\u03BA\u03B9\u03C3\u03BC\u03CC\u03C2 \u03BF\u03B9\u03BA\u03BF\u03B3\u03AD\u03BD\u03B5\u03B9\u03B1 \u03BF\u03BC\u03AC\u03B4\u03B1 \u03BF\u03BC\u03AC\u03B4\u03B1\u03C2 \u03BF\u03BC\u03AC\u03B4\u03B5\u03C2 \u03BF\u03BD\u03BF\u03BC\u03AC\u03B6\u03B5\u03C4\u03B1\u03B9 \u03BF\u03BD\u03BF\u03BC\u03B1\u03C3\u03AF\u03B1 \u03BF\u03C0\u03BF\u03AF\u03B1 \u03BF\u03C0\u03BF\u03AF\u03B5\u03C2 \u03BF\u03C0\u03BF\u03AF\u03BF \u03BF\u03C0\u03BF\u03AF\u03BF\u03B9 \u03BF\u03C0\u03BF\u03AF\u03BF\u03C2 \u03BF\u03C0\u03BF\u03AF\u03BF\u03C5 \u03BF\u03C0\u03BF\u03AF\u03C9\u03BD \u03BF\u03C0\u03CC\u03C4\u03B5 \u03C0\u03AC\u03BB\u03B9 \u03C0\u03AC\u03BD\u03C9 \u03C0\u03AD\u03B8\u03B1\u03BD\u03B5 \u03C0\u03AD\u03BD\u03C4\u03B5 \u03C0\u03AE\u03C1\u03B5 \u03C0\u03AF\u03C3\u03C9 \u03C0\u03B1\u03B9\u03B4\u03B9\u03AC \u03C0\u03B1\u03BD\u03C4\u03C1\u03B5\u03CD\u03C4\u03B7\u03BA\u03B5 \u03C0\u03B1\u03C1\u03AC \u03C0\u03B1\u03C1\u03AC\u03B4\u03B5\u03B9\u03B3\u03BC\u03B1 \u03C0\u03B1\u03C1\u03AD\u03BC\u03B5\u03B9\u03BD\u03B5 \u03C0\u03B1\u03C1\u03B1\u03B3\u03C9\u03B3\u03AE \u03C0\u03B1\u03C4\u03AD\u03C1\u03B1 \u03C0\u03B1\u03C4\u03AD\u03C1\u03B1\u03C2 \u03C0\u03B5\u03C1\u03AF \u03C0\u03B5\u03C1\u03AF\u03BF\u03B4\u03BF \u03C0\u03B5\u03C1\u03AF\u03C0\u03BF\u03C5 \u03C0\u03B5\u03C1\u03AF\u03C0\u03C4\u03C9\u03C3\u03B7 \u03C0\u03B5\u03C1\u03B9\u03BB\u03B1\u03BC\u03B2\u03AC\u03BD\u03B5\u03B9 \u03C0\u03B5\u03C1\u03B9\u03BF\u03C7\u03AD\u03C2 \u03C0\u03B5\u03C1\u03B9\u03BF\u03C7\u03AE \u03C0\u03B5\u03C1\u03B9\u03BF\u03C7\u03AE\u03C2 \u03C0\u03B5\u03C1\u03B9\u03C3\u03C3\u03CC\u03C4\u03B5\u03C1\u03B1 \u03C0\u03B5\u03C1\u03B9\u03C3\u03C3\u03CC\u03C4\u03B5\u03C1\u03B5\u03C2 \u03C0\u03B5\u03C1\u03B9\u03C3\u03C3\u03CC\u03C4\u03B5\u03C1\u03BF \u03C0\u03B5\u03C1\u03B9\u03CC\u03B4\u03BF\u03C5 \u03C0\u03B9\u03BF \u03C0\u03BB\u03AD\u03BF\u03BD \u03C0\u03BB\u03B5\u03C5\u03C1\u03AC \u03C0\u03BB\u03B7\u03B8\u03C5\u03C3\u03BC\u03BF\u03CD \u03C0\u03BB\u03B7\u03B8\u03C5\u03C3\u03BC\u03CC \u03C0\u03BF\u03BB\u03AD\u03BC\u03BF\u03C5 \u03C0\u03BF\u03BB\u03B9\u03C4\u03B9\u03BA\u03AE \u03C0\u03BF\u03BB\u03B9\u03C4\u03B9\u03BA\u03CC\u03C2 \u03C0\u03BF\u03BB\u03BB\u03AC \u03C0\u03BF\u03BB\u03BB\u03AD\u03C2 \u03C0\u03BF\u03BB\u03CD \u03C0\u03BF\u03C4\u03AD \u03C0\u03BF\u03C5 \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03C0\u03C1\u03B9\u03BD \u03C0\u03C1\u03BF\u03B2\u03BB\u03AE\u03BC\u03B1\u03C4\u03B1 \u03C0\u03C1\u03BF\u03BA\u03B5\u03B9\u03BC\u03AD\u03BD\u03BF\u03C5 \u03C0\u03C1\u03BF\u03C2 \u03C0\u03C1\u03C9\u03C4\u03AC\u03B8\u03BB\u03B7\u03BC\u03B1 \u03C0\u03C1\u03C9\u03C4\u03B5\u03CD\u03BF\u03C5\u03C3\u03B1 \u03C0\u03C1\u03CC\u03B5\u03B4\u03C1\u03BF\u03C2 \u03C0\u03C1\u03CE\u03B7\u03BD \u03C0\u03C1\u03CE\u03C4\u03B1 \u03C0\u03C1\u03CE\u03C4\u03B5\u03C2 \u03C0\u03C1\u03CE\u03C4\u03B7 \u03C0\u03C1\u03CE\u03C4\u03BF \u03C0\u03C1\u03CE\u03C4\u03BF\u03C2 \u03C0\u03C9\u03C2 \u03C0\u03CC\u03BB\u03B5\u03B9\u03C2 \u03C0\u03CC\u03BB\u03B5\u03BC\u03BF \u03C0\u03CC\u03BB\u03B7 \u03C0\u03CC\u03BB\u03B7\u03C2 \u03C1\u03CC\u03BB\u03BF \u03C3\u03AE\u03BC\u03B5\u03C1\u03B1 \u03C3\u03B1\u03BD \u03C3\u03B5\u03B6\u03CC\u03BD \u03C3\u03B5\u03B9\u03C1\u03AC \u03C3\u03B5\u03BB \u03C3\u03B7\u03BC\u03B1\u03AF\u03BD\u03B5\u03B9 \u03C3\u03B7\u03BC\u03B1\u03BD\u03C4\u03B9\u03BA\u03AE \u03C3\u03B7\u03BC\u03B1\u03BD\u03C4\u03B9\u03BA\u03CC \u03C3\u03B7\u03BC\u03B5\u03AF\u03BF \u03C3\u03BA\u03BF\u03C0\u03CC \u03C3\u03C4\u03B1 \u03C3\u03C4\u03B7 \u03C3\u03C4\u03B7\u03BD \u03C3\u03C4\u03B9\u03C2 \u03C3\u03C4\u03BF \u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1 \u03C3\u03C4\u03BF\u03BD \u03C3\u03C4\u03BF\u03C5\u03C2 \u03C3\u03C5\u03B3\u03BA\u03C1\u03CC\u03C4\u03B7\u03BC\u03B1 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03B5\u03AF\u03C7\u03B5 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03BF\u03C7\u03AE \u03C3\u03C5\u03BD\u03AD\u03C7\u03B5\u03B9\u03B1 \u03C3\u03C5\u03BD\u03AE\u03B8\u03C9\u03C2 \u03C3\u03C5\u03C7\u03BD\u03AC \u03C3\u03C7\u03AD\u03C3\u03B7 \u03C3\u03C7\u03B5\u03B4\u03CC\u03BD \u03C3\u03C7\u03B5\u03C4\u03B9\u03BA\u03AC \u03C3\u03CD\u03BC\u03C6\u03C9\u03BD\u03B1 \u03C3\u03CD\u03BD\u03BF\u03BB\u03BF \u03C3\u03CD\u03C3\u03C4\u03B7\u03BC\u03B1 \u03C3\u03CE\u03BC\u03B1 \u03C4\u03AD\u03BB\u03B7 \u03C4\u03AD\u03BB\u03BF\u03C2 \u03C4\u03AD\u03C3\u03C3\u03B5\u03C1\u03B9\u03C2 \u03C4\u03AF\u03C4\u03BB\u03BF \u03C4\u03B1\u03B9\u03BD\u03AF\u03B1 \u03C4\u03B5\u03BB\u03B5\u03C5\u03C4\u03B1\u03AF\u03B1 \u03C4\u03B5\u03BB\u03B9\u03BA\u03AC \u03C4\u03B5\u03BB\u03B9\u03BA\u03CC \u03C4\u03B7\u03BD \u03C4\u03B7\u03C2 \u03C4\u03B9\u03C2 \u03C4\u03BC\u03AE\u03BC\u03B1 \u03C4\u03BF\u03BD \u03C4\u03BF\u03C5 \u03C4\u03BF\u03C5\u03C2 \u03C4\u03BF\u03CD \u03C4\u03C1\u03AF\u03B1 \u03C4\u03C1\u03B1\u03B3\u03BF\u03CD\u03B4\u03B9 \u03C4\u03C1\u03B5\u03B9\u03C2 \u03C4\u03C1\u03CC\u03C0\u03BF \u03C4\u03C9\u03BD \u03C4\u03CC\u03C3\u03BF \u03C4\u03CC\u03C4\u03B5 \u03C4\u03CD\u03C0\u03BF \u03C5\u03C0\u03AC\u03C1\u03C7\u03B5\u03B9 \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03C5\u03C0\u03AE\u03C1\u03BE\u03B5 \u03C5\u03C0\u03CC \u03C6\u03AC\u03C3\u03B7 \u03C6\u03B1\u03AF\u03BD\u03B5\u03C4\u03B1\u03B9 \u03C6\u03BF\u03C1\u03AC \u03C6\u03BF\u03C1\u03AD\u03C2 \u03C7\u03B9\u03BB\u03B9\u03CC\u03BC\u03B5\u03C4\u03C1\u03B1 \u03C7\u03BB\u03BC \u03C7\u03C1\u03AE\u03C3\u03B7 \u03C7\u03C1\u03B7\u03C3\u03B9\u03BC\u03BF\u03C0\u03BF\u03B9\u03B5\u03AF\u03C4\u03B1\u03B9 \u03C7\u03C1\u03BF\u03BD\u03B9\u03AC \u03C7\u03C1\u03CC\u03BD\u03B9\u03B1 \u03C7\u03C1\u03CC\u03BD\u03BF \u03C7\u03C9\u03C1\u03AF\u03C2 \u03C7\u03C9\u03C1\u03B9\u03BF\u03CD \u03C7\u03C9\u03C1\u03B9\u03CC \u03C7\u03CE\u03C1\u03B1 \u03C7\u03CE\u03C1\u03B1\u03C2 \u03C7\u03CE\u03C1\u03B5\u03C2 \u03C7\u03CE\u03C1\u03BF \u03C9\u03C3\u03C4\u03CC\u03C3\u03BF \u03CC\u03BB\u03B1 \u03CC\u03BB\u03B5\u03C2 \u03CC\u03BB\u03B7 \u03CC\u03BB\u03BF \u03CC\u03BB\u03C9\u03BD \u03CC\u03BC\u03C9\u03C2 \u03CC\u03BD\u03BF\u03BC\u03AC \u03CC\u03BD\u03BF\u03BC\u03B1 \u03CC\u03C0\u03BF\u03C5 \u03CC\u03C0\u03C9\u03C2 \u03CC\u03C1\u03BF\u03C2 \u03CC\u03C3\u03BF \u03CC\u03C4\u03B1\u03BD \u03CC\u03C4\u03B9 \u03CC\u03C7\u03B9 \u03CE\u03C3\u03C4\u03B5 \u0430\u0431\u043E \u0430\u0432\u0430\u0440\u0433\u0430 \u0430\u0432\u0433\u0443\u0441\u0442 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 \u0430\u0432\u0433\u0443\u0441\u0442\u0435 \u0430\u0432\u0433\u0443\u0441\u0442\u0435\u0445\u044C \u0430\u0432\u0433\u0443\u0441\u0442\u0438 \u0430\u0432\u0438\u0430\u0446\u0438\u0438 \u0430\u0432\u0438\u043E\u043D\u0430 \u0430\u0432\u0441\u0430\u043D \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u0435\u0439 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044C \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u043E\u0433\u043E \u0430\u0432\u0442\u043E\u0440 \u0430\u0432\u0442\u043E\u0440\u0430 \u0430\u0432\u0442\u043E\u0440\u043E\u0432 \u0430\u0432\u0442\u043E\u0440\u043E\u043C \u0430\u0432\u0442\u043E\u0440\u044B \u0430\u0432\u0447 \u0430\u0432\u044B\u043B \u0430\u0433\u0430 \u0430\u0433\u0435\u043D\u0442 \u0430\u0433\u0435\u043D\u0442\u043B\u044B\u0433\u044B \u0430\u0433\u0435\u043D\u0442\u043B\u044B\u0493\u044B \u0430\u0433\u0435\u043D\u0442\u0441\u0442\u0432\u0438 \u0430\u0433\u0435\u043D\u0442\u0442\u0438\u0433\u0438 \u0430\u0433\u0435\u043D\u0442\u0442\u0456\u0433\u0456 \u0430\u0433\u043E\u043B \u0430\u0433\u043E\u043B\u043E\u0442 \u0430\u0433\u0443\u043B\u044C\u043D\u0430\u0433\u0430 \u0430\u0433\u0443\u043B\u044C\u043D\u044B \u0430\u0433\u0443\u043B\u044C\u043D\u044B\u043C \u0430\u0433\u044B\u043F \u0430\u0434\u0430\u043C \u0430\u0434\u0430\u043C\u0434\u044B \u0430\u0434\u0430\u043C\u043D\u044B\u04A3 \u0430\u0434\u0437\u0456\u043D \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u0438\u0432 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u0438\u0432\u0434\u0438\u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u0438\u0432\u043D\u043E \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u0438\u0432\u043D\u043E\u0433 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0430\u0434\u043C\u0438\u0440\u0430\u043B \u0430\u0434\u043C\u0456\u043D\u0456\u0441\u0442\u0440\u0430\u0442\u0438\u0432\u043D\u043E \u0430\u0434\u043D\u0430\u043A \u0430\u0434\u043D\u044B\u043C \u0430\u0435\u0440\u043C\u0430\u0441\u044B \u0430\u0439\u043B\u0430\u043D\u0430\u0441\u044B\u043D\u0434\u0430 \u0430\u0439\u043C\u0430\u043A\u0442\u0430\u0440\u044B\u043D \u0430\u0439\u043C\u0430\u0493\u044B\u043D\u0430 \u0430\u0439\u043C\u0433\u0438\u0439\u043D \u0430\u0439\u0440\u044B\u0433\u044B \u0430\u0439\u044B\u043B \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0438 \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u043A \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u044E \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u044F \u0430\u043A\u0430\u0434\u0435\u043C\u0456\u0457 \u0430\u043A\u043E \u0430\u043A\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u0438\u043C\u0438 \u0430\u043A\u0442\u0438\u0432\u043D\u0438\u0445 \u0430\u043A\u0442\u0438\u0432\u043D\u043E \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0438 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0456 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0430\u043A\u0442\u043E\u0440 \u0430\u043A\u0442\u0440\u0438\u0441\u0430 \u0430\u043A\u0442\u0451\u0440 \u0430\u043A\u044A\u0430\u0440\u0438\u043D \u0430\u043B\u0430 \u0430\u043B\u0430\u0431\u044B \u0430\u043B\u0430\u0431\u044B\u043D\u044B\u04A3 \u0430\u043B\u0430\u0434\u044B \u0430\u043B\u0430\u043F\u0442\u0430\u0440\u044B \u0430\u043B\u0430\u0440 \u0430\u043B\u0430\u0440\u0434\u044B\u043D \u0430\u043B\u0431\u0443\u043C \u0430\u043B\u0431\u0443\u043C\u0430 \u0430\u043B\u0433\u0430\u043D \u0430\u043B\u0434\u044B \u0430\u043B\u0435 \u0430\u043B\u0438 \u0430\u043B\u0441\u0430\u043C\u0430 \u0430\u043B\u0442\u044B\u043D \u0430\u043B\u0443 \u0430\u043B\u044B\u043D\u0433\u0430\u043D \u0430\u043B\u044B\u043F \u0430\u043B\u044B\u0443 \u0430\u043B\u044C \u0430\u043B\u044C\u0431\u043E\u043C \u0430\u043B\u044C\u0431\u043E\u043C\u0430 \u0430\u043B\u044C\u0431\u043E\u043C\u0443 \u0430\u043B\u0493\u0430\u043D \u0430\u043B\u0493\u0430\u0448\u049B\u044B \u0430\u043C\u0430\u043B\u0435\u0445\u044C \u0430\u043C\u0435\u0440\u0438\u043A\u0430\u043D\u0441\u043A\u0430\u044F \u0430\u043C\u0435\u0440\u0438\u043A\u0430\u043D\u0441\u043A\u0438 \u0430\u043C\u0435\u0440\u0438\u043A\u0430\u043D\u0441\u043A\u0438\u0439 \u0430\u043C\u0435\u0440\u0438\u043A\u0430\u043D\u0441\u043A\u0438\u0445 \u0430\u043C\u0435\u0440\u0438\u043A\u0430\u043D\u0441\u043A\u043E\u0433\u043E \u0430\u043C\u0435\u0440\u0438\u043A\u0430\u043D\u0441\u043A\u043E\u0439 \u0430\u043C\u0435\u0440\u0438\u043A\u0430\u043D\u0441\u044C\u043A\u0438\u0439 \u0430\u043C\u0435\u0440\u0438\u0447\u043A\u043E\u0458 \u0430\u043C\u0456\u043D\u043E\u043A\u0438\u0441\u043B\u043E\u0442 \u0430\u043D\u0430\u043B\u0438\u0437 \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u0430\u043D\u0433\u043B \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u043C \u0430\u043D\u0433\u043B\u0438\u0441\u043A\u0438 \u0430\u043D\u0433\u043B\u0438\u0441\u04E3 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u043A\u0430\u0439 \u0430\u043D\u0441\u0430\u043C\u0431\u043B\u044C \u0430\u043D\u0445\u043D\u044B \u0430\u043D\u044B \u0430\u043D\u044B\u043D \u0430\u043D\u044B\u049B\u0442\u0430\u043C\u0430\u043B\u044B\u049B \u0430\u043D\u044B\u04A3 \u0430\u043D\u04B7\u043E\u043C \u0430\u043F\u0440\u0435\u043B\u0435 \u0430\u043F\u0440\u0435\u043B\u0435\u0445\u044C \u0430\u043F\u0440\u0435\u043B\u044C \u0430\u043F\u0440\u0435\u043B\u044F \u0430\u043F\u0440\u0438\u043B \u0430\u043F\u0440\u0438\u043B\u0430 \u0430\u0440\u0430 \u0430\u0440\u0430\u0431 \u0430\u0440\u0430\u043B\u044B\u043A \u0430\u0440\u0430\u0441\u044B\u043D\u0434\u0430 \u0430\u0440\u0430\u0441\u044B\u043D\u0434\u0430\u0493\u044B \u0430\u0440\u0430\u04BB\u044B\u043D\u0434\u0430 \u0430\u0440\u0435\u043D\u0430\u043D \u0430\u0440\u0435\u0441\u0442\u043E\u0432\u0430\u043D \u0430\u0440\u043A\u0442\u0438\u043A\u0430\u043D \u0430\u0440\u043A\u044B\u043B\u0443\u0443 \u0430\u0440\u043C\u0438\u0435\u0439 \u0430\u0440\u043C\u0438\u0438 \u0430\u0440\u043C\u0438\u044E \u0430\u0440\u043C\u0438\u044F \u0430\u0440\u043C\u0456\u044F \u0430\u0440\u043C\u0456\u0457 \u0430\u0440\u043D\u0430\u043B\u0493\u0430\u043D \u0430\u0440\u0442\u0438\u043B\u043B\u0435\u0440\u0438\u0438 \u0430\u0440\u0442\u0438\u0441\u0442 \u0430\u0440\u0445\u0438\u0432 \u0430\u0440\u0445\u0438\u0432\u043B\u0430\u043D\u0103 \u0430\u0440\u0445\u0438\u0432\u043B\u0430\u043D\u0433\u0430\u043D \u0430\u0440\u0445\u0438\u0432\u043B\u0430\u043D\u0493\u0430\u043D \u0430\u0440\u0445\u0438\u0435\u043F\u0438\u0441\u043A\u043E\u043F \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u043E\u0440 \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0430 \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u044B \u0430\u0440\u0445\u0456\u0442\u0435\u043A\u0442\u0443\u0440\u0438 \u0430\u0440\u044B\u0433\u0456\u043D\u0430\u043B\u044C\u043D\u0430\u0433\u0430 \u0430\u0440\u044B\u0433\u0456\u043D\u0430\u043B\u044C\u043D\u0430\u0439 \u0430\u0440\u044B\u0433\u0456\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u0430\u0440\u049B\u044B\u043B\u044B \u0430\u0441\u0430 \u0430\u0441\u0430\u043D \u0430\u0441\u0430\u043D\u0430\u043D \u0430\u0441\u0430\u043D\u0435\u0445\u044C \u0430\u0441\u0441\u043E\u0446\u0438\u0430\u0446\u0438\u0438 \u0430\u0441\u0442 \u0430\u0441\u0442\u0435\u0440\u043E\u0438\u0434\u0430 \u0430\u0441\u0442\u0435\u0440\u043E\u0457\u0434 \u0430\u0441\u0442\u0440\u043E\u043D\u043E\u043C\u0441\u043A\u0438 \u0430\u0441\u0442\u0440\u043E\u043D\u043E\u043C\u044B \u0430\u0441\u0444\u0430\u043B\u0442 \u0430\u0442\u0430 \u0430\u0442\u0430\u043A\u0438 \u0430\u0442\u0430\u043B\u0433\u0430\u043D \u0430\u0442\u0430\u0443\u043B\u0430\u0440\u044B \u0430\u0442\u043B\u0430\u043D\u0442\u0438\u043A\u0430\u043D \u0430\u0442\u043B\u0430\u0441\u043E\u0442 \u0430\u0442\u0440\u044B\u043C\u0430\u045E \u0430\u0442\u0442\u044B \u0430\u0442\u044B \u0430\u0442\u044B\u043D\u0434\u0430\u0433\u044B \u0430\u0442\u044B\u043D\u0434\u0430\u0493\u044B \u0430\u0442\u04A1\u0430\u0499\u0430\u043D\u0493\u0430\u043D \u0430\u0443\u0434\u0430\u043D\u0434\u0430\u0441\u0442\u044B\u0440\u0443 \u0430\u0443\u0434\u0430\u043D\u044B \u0430\u0443\u0434\u0430\u043D\u044B\u043D\u0434\u0430\u0493\u044B \u0430\u0443\u0434\u0430\u043D\u044B\u043D\u044B\u04A3 \u0430\u0443\u043C\u0430\u0493\u044B \u0430\u0443\u043C\u0430\u049B\u0442\u0430\u0440\u044B\u043D\u0430\u043D \u0430\u0443\u044B\u043B \u0430\u0443\u044B\u043B\u0434\u044B\u049B \u0430\u0443\u044B\u043B\u044B \u0430\u0443\u044B\u043B\u044B\u043D\u0434\u0430 \u0430\u0448\u0430 \u0430\u0448\u049B\u0430\u043D \u0430\u044C\u0445\u043A\u0430 \u0430\u044C\u0445\u043A\u0435 \u0430\u044C\u0445\u043A\u0435\u043D\u0430\u043D \u0430\u044C\u0445\u043A\u0435\u043D\u0446\u0430 \u0430\u044D\u0440\u043E\u043F\u043E\u0440\u0442 \u0430\u044F\u043D\u0442\u044B \u0430\u0493\u0430 \u0430\u0493\u044B\u043B \u0430\u0493\u044B\u043B\u0448 \u0430\u0493\u044B\u043B\u0448\u044B\u043D\u0448\u0430 \u0430\u0493\u044B\u043F \u0430\u04B3\u043E\u043B\u0438\u043D\u0438\u0448\u0438\u043D\u0438 \u0431\u0430\u0433\u0430\u0442\u043E \u0431\u0430\u0433\u0430\u0442\u044C\u043E\u0445 \u0431\u0430\u0437\u0430 \u0431\u0430\u0437\u0430\u0441\u044B \u0431\u0430\u0437\u0430\u0441\u044B\u043D\u0434\u0430\u0493\u044B \u0431\u0430\u0437\u0435 \u0431\u0430\u0437\u0438 \u0431\u0430\u0437\u0443 \u0431\u0430\u0437\u044B \u0431\u0430\u0437\u0456 \u0431\u0430\u0439 \u0431\u0430\u0439\u0432 \u0431\u0430\u0439\u0433\u0430\u0430 \u0431\u0430\u0439\u0434\u0430\u0433 \u0431\u0430\u0439\u0436\u044D\u044D \u0431\u0430\u0439\u043B\u0430\u043D\u044B\u0441\u0442\u044B \u0431\u0430\u0439\u043D\u0430 \u0431\u0430\u0439\u0441\u0430\u043D \u0431\u0430\u0439\u0445 \u0431\u0430\u043B\u0430 \u0431\u0430\u043B\u0430\u043B\u0430\u0440 \u0431\u0430\u043B\u0430\u043D\u0434\u0438\u0438 \u0431\u0430\u043B\u0435\u0442 \u0431\u0430\u043B\u0435\u0442\u0430 \u0431\u0430\u043D\u043A \u0431\u0430\u043D\u043A\u0430 \u0431\u0430\u0440 \u0431\u0430\u0440\u0430 \u0431\u0430\u0440\u0430\u043C \u0431\u0430\u0440\u0430\u043C\u0430\u043D \u0431\u0430\u0440\u0430\u043C\u0435\u0440\u0430 \u0431\u0430\u0440\u0430\u043C\u0435\u0440\u0430\u0447\u0443 \u0431\u0430\u0440\u0430\u043C\u0435\u0445\u044C \u0431\u0430\u0440\u0434\u044B\u043A \u0431\u0430\u0440\u043B\u044B\u049B \u0431\u0430\u0440\u043B\u044B\u04A1\u04A1\u0430 \u0431\u0430\u0440\u043E\u0438 \u0431\u0430\u0440\u043E\u043D \u0431\u0430\u0440\u044B\u043F \u0431\u0430\u0441 \u0431\u0430\u0441\u0435\u0439\u043D \u0431\u0430\u0441\u043F\u0430\u0441\u044B \u0431\u0430\u0441\u0441\u0435\u0439\u043D \u0431\u0430\u0441\u0441\u0435\u0439\u043D\u0115 \u0431\u0430\u0441\u0441\u0435\u0439\u043D\u0430 \u0431\u0430\u0441\u0441\u0435\u0439\u043D\u0438 \u0431\u0430\u0441\u0441\u0435\u0439\u043D\u0438\u043D\u0438\u043D \u0431\u0430\u0441\u0441\u0435\u0439\u043D\u043E\u0432\u043E\u043C\u0443 \u0431\u0430\u0441\u0441\u0435\u0439\u043D\u044B \u0431\u0430\u0441\u0442\u0430\u0434\u044B \u0431\u0430\u0441\u0442\u0430\u043F \u0431\u0430\u0441\u0442\u044B \u0431\u0430\u0441\u0448\u044B\u0441\u044B \u0431\u0430\u0441\u044B\u043B\u044B\u043C\u044B\u043D\u044B\u04A3 \u0431\u0430\u0441\u044B\u043F \u0431\u0430\u0441\u049B\u0430 \u0431\u0430\u0441\u049B\u0430\u0440\u0493\u0430\u043D \u0431\u0430\u0442\u0430\u043B\u044C\u043E\u043D \u0431\u0430\u0442\u0430\u043B\u044C\u043E\u043D\u0430 \u0431\u0430\u0442\u0442\u0430\u0445\u044C \u0431\u0430\u0442\u044C\u043A\u0430 \u0431\u0430\u0442\u044C\u043A\u043E \u0431\u0430\u0445\u044C\u043D\u0435\u0445\u044C \u0431\u0430\u0448 \u0431\u0430\u0448\u043A\u0430 \u0431\u0430\u0448\u043A\u044B \u0431\u0430\u0448\u043B\u0430\u0439 \u0431\u0430\u0448\u0445\u0430 \u0431\u0430\u0448\u0445\u0430\u043B\u043B\u0430 \u0431\u0430\u0448\u0445\u0430\u043B\u043B\u0430\u0448 \u0431\u0430\u0448\u0447\u044B\u0441\u044B \u0431\u0430\u0448\u044B\u043D\u0434\u0430 \u0431\u0430\u0448\u04A1\u0430 \u0431\u0430\u0448\u04A1\u043E\u0440\u0442 \u0431\u0430\u0449\u0430 \u0431\u0430\u04B3\u0440 \u0431\u0435\u0430 \u0431\u0435\u0437 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438 \u0431\u0435\u0437\u043F\u0435\u043A\u0438 \u0431\u0435\u0437\u043F\u043E\u0441\u0435\u0440\u0435\u0434\u043D\u044C\u043E \u0431\u0435\u0437\u0440\u043E\u0431\u0456\u0442\u043D\u0438\u043C\u0438 \u0431\u0435\u043A\u0438\u0442\u0438\u043B\u0433\u0435\u043D \u0431\u0435\u043A\u0456\u0442\u0456\u043B\u0433\u0435\u043D \u0431\u0435\u043B \u0431\u0435\u043B\u0430\u0440\u0443\u0441\u043A\u0430\u0439 \u0431\u0435\u043B\u0430\u0440\u0443\u0441\u043A\u0456 \u0431\u0435\u043B\u0433\u0438\u043B\u04AF\u04AF \u0431\u0435\u043B\u0433\u0456\u043B\u0456 \u0431\u0435\u043B\u044B\u0445 \u0431\u0435\u043B\u04D9\u043D \u0431\u0435\u0440 \u0431\u0435\u0440\u0435 \u0431\u0435\u0440\u0435\u0433 \u0431\u0435\u0440\u0435\u0433\u0430 \u0431\u0435\u0440\u0435\u0433\u0443 \u0431\u0435\u0440\u0435\u0434\u0456 \u0431\u0435\u0440\u0435\u0437\u043D\u044F \u0431\u0435\u0440\u0435\u0437\u043D\u0456 \u0431\u0435\u0440\u0435\u0437\u0456 \u0431\u0435\u0440\u0435\u043D\u0441\u0435 \u0431\u0435\u0440\u0435\u043D\u0447\u0435 \u0431\u0435\u0440\u043A\u0430\u0442\u0435 \u0431\u0435\u0440\u04AF\u04AF \u0431\u0435\u0442 \u0431\u0435\u0446\u0430\u0448 \u0431\u0435\u0448\u0435 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0438 \u0431\u0438\u0432\u0430 \u0431\u0438\u0434\u0430\u0442 \u0431\u0438\u0434\u0435 \u0431\u0438\u0434\u0435\u0458\u045C\u0438 \u0431\u0438\u0437\u043D\u0435\u0441 \u0431\u0438\u0439 \u0431\u0438\u043A \u0431\u0438\u043B \u0431\u0438\u043B\u0430 \u0431\u0438\u043B\u0435 \u0431\u0438\u043B\u0438 \u0431\u0438\u043B\u0438\u043C \u0431\u0438\u043B\u043E \u0431\u0438\u043B\u04D9\u043C\u04D9\u043B\u04D9\u0440\u0435\u043D\u0434\u04D9 \u0431\u0438\u043E \u0431\u0438\u043E\u0433\u0440\u0430\u0444\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0431\u0438\u0440 \u0431\u0438\u0440\u0435\u0434\u04D9 \u0431\u0438\u0440\u0438 \u0431\u0438\u0440\u0438\u043D\u0447\u0438 \u0431\u0438\u0442 \u0431\u0438\u0442\u0432\u0435 \u0431\u0438\u0442\u0432\u044B \u0431\u0438\u0442\u0438 \u0431\u0438\u0442\u043A\u0430 \u0431\u0438\u0442\u043A\u0430\u0442\u0430 \u0431\u043B\u0430\u0433\u043E\u0434\u0430\u0440\u044F \u0431\u043B\u0438\u0437 \u0431\u043B\u0438\u0437\u043E \u0431\u043B\u0438\u0437\u044C\u043A\u043E \u0431\u043B\u043E\u043A \u0431\u043E\u0432\u0445\u0430 \u0431\u043E\u0433 \u0431\u043E\u0433\u0430 \u0431\u043E\u0435\u0432\u043E\u0439 \u0431\u043E\u0435\u0432\u044B\u0435 \u0431\u043E\u0435\u0432\u044B\u0445 \u0431\u043E\u0438 \u0431\u043E\u0439 \u0431\u043E\u0439\u043E\u0432\u0438\u0445 \u0431\u043E\u0439\u044B\u043D\u0448\u0430 \u0431\u043E\u043A\u0443 \u0431\u043E\u043B \u0431\u043E\u043B\u0430\u0434\u044B \u0431\u043E\u043B\u0430\u043B\u0443\u0448 \u0431\u043E\u043B\u0430\u0442\u044B\u043D \u0431\u043E\u043B\u0433 \u0431\u043E\u043B\u0433\u043E\u043D \u0431\u043E\u043B\u0434\u044B \u0431\u043E\u043B\u0435\u0435 \u0431\u043E\u043B\u0435\u0437\u043D\u0438 \u0431\u043E\u043B\u0435\u0441\u0442\u0438 \u0431\u043E\u043B\u0436 \u0431\u043E\u043B\u043C\u0430\u0439\u0434\u044B \u0431\u043E\u043B\u043D\u043E \u0431\u043E\u043B\u043E\u043D \u0431\u043E\u043B\u043E\u0442 \u0431\u043E\u043B\u043E\u0445 \u0431\u043E\u043B\u0441\u0430 \u0431\u043E\u043B\u0441\u043E\u043D \u0431\u043E\u043B\u0443\u043F \u0431\u043E\u043B\u0443\u044B \u0431\u043E\u043B\u044B\u043F \u0431\u043E\u043B\u044C\u0448 \u0431\u043E\u043B\u044C\u0448\u0430\u044F \u0431\u043E\u043B\u044C\u0448\u0435 \u0431\u043E\u043B\u044C\u0448\u0435\u0439 \u0431\u043E\u043B\u044C\u0448\u0438\u0435 \u0431\u043E\u043B\u044C\u0448\u0438\u043C \u0431\u043E\u043B\u044C\u0448\u0438\u043D\u0441\u0442\u0432\u0430 \u0431\u043E\u043B\u044C\u0448\u0438\u043D\u0441\u0442\u0432\u0435 \u0431\u043E\u043B\u044C\u0448\u0438\u043D\u0441\u0442\u0432\u043E \u0431\u043E\u043B\u044C\u0448\u0438\u0445 \u0431\u043E\u043B\u044C\u0448\u043E\u0433\u043E \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0431\u043E\u043B\u044C\u0448\u0443\u044E \u0431\u043E\u043B\u0493\u0430\u043D \u0431\u043E\u043D\u0434\u0438 \u0431\u043E\u0440\u0431\u0430 \u0431\u043E\u0440\u0431\u0438 \u0431\u043E\u0440\u0431\u043E\u0440\u0443 \u0431\u043E\u0440\u043E\u0442\u044C\u0431\u0438 \u0431\u043E\u0440\u0442\u0443 \u0431\u043E\u0440\u044C\u0431\u0435 \u0431\u043E\u0440\u044C\u0431\u044B \u0431\u043E\u044E \u0431\u043E\u044E\u043D\u0447\u0430 \u0431\u043E\u044F \u0431\u043E\u044F\u0445 \u0431\u0440\u0430\u0432 \u0431\u0440\u0430\u043A \u0431\u0440\u0430\u043A\u0430 \u0431\u0440\u0430\u043B\u0438 \u0431\u0440\u0430\u0442 \u0431\u0440\u0430\u0442\u0430 \u0431\u0440\u0430\u0442\u043E\u043C \u0431\u0440\u0430\u0442\u044C\u0435\u0432 \u0431\u0440\u0437\u043E \u0431\u0440\u0438\u0433\u0430\u0434\u0430 \u0431\u0440\u0438\u0433\u0430\u0434\u0438 \u0431\u0440\u0438\u0433\u0430\u0434\u044B \u0431\u0440\u043E\u0439 \u0431\u0440\u043E\u0458 \u0431\u0440\u043E\u0458\u0430 \u0431\u0440\u043E\u0458\u043E\u0442 \u0431\u0440\u043E\u0458\u0443 \u0431\u0443\u0432 \u0431\u0443\u0434 \u0431\u0443\u0434\u0430 \u0431\u0443\u0434\u0435 \u0431\u0443\u0434\u0435\u0442 \u0431\u0443\u0434\u0438\u043D\u043A\u0443 \u0431\u0443\u0434\u0438\u043D\u043E\u043A \u0431\u0443\u0434\u0443\u0442 \u0431\u0443\u0434\u0443\u0442\u044C \u0431\u0443\u0434\u0443\u0447\u0438 \u0431\u0443\u0434\u0443\u0449\u0435\u0433\u043E \u0431\u0443\u0434\u044C \u0431\u0443\u0434\u0456\u0432\u043B\u0456 \u0431\u0443\u0434\u0456\u0432\u043D\u0438\u0446\u0442\u0432\u0430 \u0431\u0443\u0434\u0456\u0432\u043D\u0438\u0446\u0442\u0432\u043E \u0431\u0443\u0435\u043D\u0447\u0430 \u0431\u0443\u0439 \u0431\u0443\u0439\u044B\u043D\u0441\u0430 \u0431\u0443\u043B \u0431\u0443\u043B\u0430 \u0431\u0443\u043B\u0433\u0430\u043D \u0431\u0443\u043B\u0438 \u0431\u0443\u043B\u043E \u0431\u0443\u043B\u044B\u043F \u0431\u0443\u043B\u0493\u0430\u043D \u0431\u0443\u0441\u0430\u0434 \u0431\u0443\u0442\u0438 \u0431\u0443\u0442\u0442 \u0431\u0443\u044E\u0443 \u0431\u044A\u0434\u0430\u0442 \u0431\u044A\u0434\u0435 \u0431\u044A\u043B\u0433\u0430\u0440\u0438 \u0431\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0430 \u0431\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0430\u0442\u0430 \u0431\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0438 \u0431\u044B\u0432\u0448\u0435\u0433\u043E \u0431\u044B\u0432\u0448\u0435\u0439 \u0431\u044B\u0432\u0448\u0438\u0439 \u0431\u044B\u043B \u0431\u044B\u043B\u0430 \u0431\u044B\u043B\u0438 \u0431\u044B\u043B\u043E \u0431\u044B\u043B\u0456 \u0431\u044B\u0441\u0442\u0440\u043E \u0431\u044B\u0442\u044C \u0431\u044B\u0446\u044C \u0431\u044B\u045E \u0431\u044E\u0440\u043E \u0431\u0456\u0431\u043B\u0456\u043E\u0442\u0435\u043A\u0430 \u0431\u0456\u0431\u043B\u0456\u044F\u0442\u044D\u043A\u0430 \u0431\u0456\u043B\u043A\u0430 \u0431\u0456\u043B\u043E\u043A \u0431\u0456\u043B\u044C\u0448 \u0431\u0456\u043B\u044C\u0448\u0435 \u0431\u0456\u043B\u044C\u0448\u043E\u0441\u0442\u0456 \u0431\u0456\u043B\u044C\u0448\u0456\u0441\u0442\u044C \u0431\u0456\u043B\u044F \u0431\u0456\u043B\u0456\u043C \u0431\u0456\u0440 \u0431\u0456\u0440\u0430\u049B \u0431\u0456\u0440\u0433\u0435 \u0431\u0456\u0440\u043D\u0435\u0448\u0435 \u0431\u0456\u0440\u0456 \u0431\u0456\u0440\u0456\u043D\u0448\u0456 \u0431\u0456\u0442\u0456\u0440\u0433\u0435\u043D \u0431\u04AF\u0445 \u0431\u04B1\u043B \u0431\u04E9\u0433\u04E9\u04E9\u0434 \u0431\u04E9\u043B\u0456\u0433\u0456 \u0431\u04E9\u043B\u0456\u043D\u0435\u0434\u0456 \u0431\u04E9\u043B\u04AF\u0433\u04AF \u0431\u04E9\u043B\u04AF\u043D\u04E9\u0442 \u0431\u04E9\u0442\u04D9 \u0432\u0103\u0440\u0440\u0438\u043D\u0447\u0435\u043D \u0432\u0430\u0439\u043D\u044B \u0432\u0430\u043A\u044B\u0442\u044B \u0432\u0430\u043D \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u0432\u0430\u04A1\u044B\u0442\u0442\u0430 \u0432\u0431\u043B\u0438\u0437\u0438 \u0432\u0432\u0430\u0436\u0430\u044E\u0442\u044C \u0432\u0432\u0430\u0436\u0430\u0454\u0442\u044C\u0441\u044F \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0432\u0434\u043E\u043B\u044C \u0432\u0435\u0431 \u0432\u0435\u043A \u0432\u0435\u043A\u0430 \u0432\u0435\u043A\u0435 \u0432\u0435\u043A\u043E\u0432 \u0432\u0435\u043A\u0443 \u0432\u0435\u043B\u0438 \u0432\u0435\u043B\u0438\u043A\u0430 \u0432\u0435\u043B\u0438\u043A\u0435 \u0432\u0435\u043B\u0438\u043A\u0438 \u0432\u0435\u043B\u0438\u043A\u0438\u0439 \u0432\u0435\u043B\u0438\u043A\u0438\u043C \u0432\u0435\u043B\u0438\u043A\u0438\u0445 \u0432\u0435\u043B\u0438\u043A\u043E\u0433\u043E \u0432\u0435\u043B\u0438\u043A\u0443 \u0432\u0435\u043B\u0438\u043A\u0456 \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u0430 \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u0443 \u0432\u0435\u043B\u044C\u043C\u0456 \u0432\u0435\u043E\u043C\u0430 \u0432\u0435\u0440\u0430\u0441\u043D\u044F \u0432\u0435\u0440\u0435\u0441\u043D\u044F \u0432\u0435\u0440\u0435\u0441\u043D\u0456 \u0432\u0435\u0440\u0437\u0438\u0458\u0430 \u0432\u0435\u0440\u043D\u0443\u043B\u0441\u044F \u0432\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u0432\u0435\u0440\u043E\u044F\u0442\u043D\u043E \u0432\u0435\u0440\u0441\u0438\u0438 \u0432\u0435\u0440\u0441\u0438\u044F \u0432\u0435\u0440\u0441\u0456\u044F \u0432\u0435\u0440\u0441\u0456\u0457 \u0432\u0435\u0440\u0445\u043D\u0435\u0439 \u0432\u0435\u0441\u0442\u0438 \u0432\u0435\u0441\u0442\u043D\u0438\u043A \u0432\u0435\u0441\u044C \u0432\u0435\u0441\u044C\u043C\u0430 \u0432\u0435\u0447\u0435 \u0432\u0435\u0449\u0435\u0441\u0442\u0432 \u0432\u0435\u0449\u0435\u0441\u0442\u0432\u0430 \u0432\u0435\u045B \u0432\u0435\u045B\u0438 \u0432\u0436\u0435 \u0432\u0437\u044F\u0432 \u0432\u0437\u044F\u043B \u0432\u0437\u044F\u043B\u0438 \u0432\u0438\u0431\u043E\u0440\u0456\u0432 \u0432\u0438\u0432\u0447\u0435\u043D\u043D\u044F \u0432\u0438\u0433\u043B\u044F\u0434\u0456 \u0432\u0438\u0434 \u0432\u0438\u0434\u0430 \u0432\u0438\u0434\u0430\u043D\u043D\u044F \u0432\u0438\u0434\u0435 \u0432\u0438\u0434\u0435\u043E \u0432\u0438\u0434\u0438 \u0432\u0438\u0434\u043E\u0432 \u0432\u0438\u0434\u043E\u0432\u0435 \u0432\u0438\u0434\u043E\u043C \u0432\u0438\u0434\u043E\u0442 \u0432\u0438\u0434\u0443 \u0432\u0438\u0434\u044B \u0432\u0438\u0434\u0456\u0432 \u0432\u0438\u0435\u0442\u0430 \u0432\u0438\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0432\u0438\u0439\u0448\u043B\u0430 \u0432\u0438\u0439\u0448\u043E\u0432 \u0432\u0438\u043A\u043E\u043D\u0430\u043D\u043D\u044F \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u043D\u043D\u044F \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0432\u0430\u0442\u0438 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u044E\u0442\u044C \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u044E\u0442\u044C\u0441\u044F \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F \u0432\u0438\u043B\u043E\u044F\u0442\u0438 \u0432\u0438\u043D\u0430 \u0432\u0438\u043D\u043E\u0441\u0438\u043B\u0430 \u0432\u0438\u043F\u0430\u0434\u043A\u0443 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u0430 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E \u0432\u0438\u0441\u0438\u043D\u0430\u0442\u0430 \u0432\u0438\u0441\u0438\u043D\u0438 \u0432\u0438\u0441\u043E\u043A\u0430 \u0432\u0438\u0441\u043E\u043A\u043E \u0432\u0438\u0441\u043E\u0447\u0438\u043D\u0430 \u0432\u0438\u0441\u0442\u0443\u043F\u0430\u0432 \u0432\u0438\u0446\u0435 \u0432\u0438\u0448\u0435 \u0432\u0438\u0449\u0435 \u0432\u043A\u043B\u0430\u0434 \u0432\u043A\u043B\u0443\u0447\u0435\u043D \u0432\u043A\u043B\u0443\u0447\u0443\u0432\u0430\u0458\u045C\u0438 \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u0432\u043A\u043B\u044E\u0447\u0430\u044E\u0447\u0438 \u0432\u043A\u043B\u044E\u0447\u0430\u044F \u0432\u043A\u043B\u044E\u0447\u0430\u0454 \u0432\u043A\u043B\u044E\u0447\u0432\u0430 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0430 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u043B\u043D\u043E \u0432\u043B\u0430\u0434\u0430 \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F \u0432\u043B\u0430\u0434\u0438 \u0432\u043B\u0430\u0434\u0443 \u0432\u043B\u0430\u0441\u0442 \u0432\u043B\u0430\u0441\u0442\u0438 \u0432\u043B\u0430\u0441\u0442\u044C \u0432\u043B\u0438\u0437\u0430 \u0432\u043B\u0438\u044F\u043D\u0438\u0435 \u0432\u043B\u0438\u044F\u043D\u0438\u0435\u043C \u0432\u043B\u0438\u044F\u043D\u0438\u044F \u0432\u043C\u0435\u0441\u0442\u0435 \u0432\u043C\u0435\u0441\u0442\u043E \u0432\u043D\u0430\u0441\u043B\u0456\u0434\u043E\u043A \u0432\u043D\u0435 \u0432\u043D\u0435\u0441\u0435\u043D\u0438\u0438 \u0432\u043D\u0438\u0437 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u0435 \u0432\u043D\u043E\u0432\u044C \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0445 \u0432\u043D\u0443\u0442\u0440\u0438 \u0432\u043D\u0443\u0442\u0440\u0456\u0448\u043D\u0456\u0445 \u0432\u043E\u0431\u043B\u0430\u0441\u0446\u044C \u0432\u043E\u0431\u043B\u0430\u0441\u0446\u0456 \u0432\u043E\u0434 \u0432\u043E\u0434\u0430 \u0432\u043E\u0434\u0430\u0442\u0430 \u0432\u043E\u0434\u0435 \u0432\u043E\u0434\u0438 \u0432\u043E\u0434\u043D\u043E\u0433\u043E \u0432\u043E\u0434\u043D\u043E\u043C \u0432\u043E\u0434\u043D\u044B\u0439 \u0432\u043E\u0434\u043D\u044B\u0445 \u0432\u043E\u0434\u043E\u0439 \u0432\u043E\u0434\u043E\u0445\u043E\u0437\u044F\u0439\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0432\u043E\u0434\u0443 \u0432\u043E\u0434\u044B \u0432\u043E\u0435\u043D\u043D\u043E \u0432\u043E\u0435\u043D\u043D\u043E\u0433\u043E \u0432\u043E\u0435\u043D\u043D\u043E\u0439 \u0432\u043E\u0435\u043D\u043D\u0443\u044E \u0432\u043E\u0435\u043D\u043D\u044B\u0435 \u0432\u043E\u0435\u043D\u043D\u044B\u0439 \u0432\u043E\u0435\u043D\u043D\u044B\u0445 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F \u0432\u043E\u0437\u0433\u043B\u0430\u0432\u0438\u043B \u0432\u043E\u0437\u0433\u043B\u0430\u0432\u043B\u044F\u043B \u0432\u043E\u0437\u0434\u0443\u0445\u0430 \u0432\u043E\u0437\u0435\u0440\u0430 \u0432\u043E\u0437\u043B\u0435 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0438 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u044C \u0432\u043E\u0437\u0440\u0430\u0441\u0442 \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0430 \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0435 \u0432\u043E\u0439\u043D \u0432\u043E\u0439\u043D\u0430 \u0432\u043E\u0439\u043D\u0430\u0442\u0430 \u0432\u043E\u0439\u043D\u0435 \u0432\u043E\u0439\u043D\u0443 \u0432\u043E\u0439\u043D\u044B \u0432\u043E\u0439\u0441\u043A \u0432\u043E\u0439\u0441\u043A\u0430 \u0432\u043E\u0439\u0441\u043A\u0430\u043C\u0438 \u0432\u043E\u0439\u0441\u043A\u0438 \u0432\u043E\u043A\u0430\u043B \u0432\u043E\u043A\u0440\u0443\u0433 \u0432\u043E\u043B\u043E\u0441\u0442\u0438 \u0432\u043E\u043B\u043E\u0441\u0442\u044C \u0432\u043E\u043B\u043E\u0441\u0442\u0456 \u0432\u043E\u043D\u0430 \u0432\u043E\u043D\u0438 \u0432\u043E\u043D\u043E \u0432\u043E\u043E\u0431\u0449\u0435 \u0432\u043E\u043F\u0440\u043E\u0441 \u0432\u043E\u043F\u0440\u043E\u0441\u0430\u043C \u0432\u043E\u043F\u0440\u043E\u0441\u044B \u0432\u043E\u0440\u043E\u0442\u0430 \u0432\u043E\u0441\u0435\u043C\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0438\u044F \u0432\u043E\u0441\u0442\u043E\u043A \u0432\u043E\u0441\u0442\u043E\u043A\u0435 \u0432\u043E\u0441\u0442\u043E\u043A\u0443 \u0432\u043E\u0441\u0442\u043E\u0447\u043D\u0435\u0435 \u0432\u043E\u0441\u0442\u043E\u0447\u043D\u043E\u0439 \u0432\u043E\u0441\u044C\u043C\u0438 \u0432\u043E\u0448\u043B\u0430 \u0432\u043E\u0448\u043B\u0438 \u0432\u043E\u0448\u0451\u043B \u0432\u043E\u0454\u0432\u043E\u0434\u0441\u0442\u0432\u0430 \u0432\u043E\u0458\u043D\u0430 \u0432\u043E\u0458\u0441\u043A\u0430 \u0432\u043E\u0458\u0441\u043A\u0435 \u0432\u043E\u049B\u0435\u044A \u0432\u043F\u0430\u0434\u0435\u043D\u0438\u044F \u0432\u043F\u0435\u0440\u0432\u044B\u0435 \u0432\u043F\u0435\u0440\u0448\u0435 \u0432\u043F\u043B\u0438\u0432 \u0432\u043F\u043B\u0438\u0432\u0443 \u0432\u043F\u043B\u043E\u0442\u044C \u0432\u043F\u043E\u043B\u043D\u0435 \u0432\u043F\u043E\u0441\u043B\u0435\u0434\u0441\u0442\u0432\u0438\u0438 \u0432\u0440\u0430\u0447 \u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442 \u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0438 \u0432\u0440\u0435\u043C\u0435 \u0432\u0440\u0435\u043C\u0435\u043D\u0430 \u0432\u0440\u0435\u043C\u0435\u043D\u0435\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u0432\u0440\u0435\u043C\u0435\u0442\u043E \u0432\u0440\u0435\u043C\u044F \u0432\u0440\u0435\u043C\u0451\u043D \u0432\u0440\u0437 \u0432\u0440\u043B\u043E \u0432\u0440\u0441\u0442\u0430 \u0432\u0440\u0441\u0442\u0435 \u0432\u0440\u0448\u0435\u043D\u043E \u0432\u0440\u044A\u0437\u043A\u0430 \u0432\u0440\u044A\u0445 \u0432\u0441\u0435 \u0432\u0441\u0435\u0433\u0434\u0430 \u0432\u0441\u0435\u0433\u043E \u0432\u0441\u0435\u0439 \u0432\u0441\u0435\u043A\u0438 \u0432\u0441\u0435\u043C \u0432\u0441\u0435\u043C\u0438 \u0432\u0441\u0435\u043C\u0443 \u0432\u0441\u0435\u0445 \u0432\u0441\u0438\u0447\u043A\u0438 \u0432\u0441\u043A\u043E\u0440\u0435 \u0432\u0441\u043B\u0435\u0434\u0441\u0442\u0432\u0438\u0435 \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u0442\u0441\u044F \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u044E\u0442\u0441\u044F \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u0432\u0441\u0442\u0443\u043F\u0438\u0432 \u0432\u0441\u0442\u0443\u043F\u0438\u043B \u0432\u0441\u044C\u043E\u0433\u043E \u0432\u0441\u044E \u0432\u0441\u044F \u0432\u0441\u044F\u043A\u0430 \u0432\u0441\u0451 \u0432\u0441\u0456 \u0432\u0441\u0456\u0445 \u0432\u0442\u043E\u0440\u0430\u0442\u0430 \u0432\u0442\u043E\u0440\u0430\u044F \u0432\u0442\u043E\u0440\u0438 \u0432\u0442\u043E\u0440\u043E\u0433\u043E \u0432\u0442\u043E\u0440\u043E\u0435 \u0432\u0442\u043E\u0440\u043E\u0439 \u0432\u0442\u043E\u0440\u043E\u043C \u0432\u0442\u043E\u0440\u044B\u043C \u0432\u0443\u043B \u0432\u0443\u043B\u0438\u0446\u044F \u0432\u0443\u043B\u0438\u0446\u0456 \u0432\u0445\u043E\u0434\u0438\u043B \u0432\u0445\u043E\u0434\u0438\u043B\u0430 \u0432\u0445\u043E\u0434\u0438\u043B\u0438 \u0432\u0445\u043E\u0434\u0438\u043B\u043E \u0432\u0445\u043E\u0434\u0438\u0442 \u0432\u0445\u043E\u0434\u0438\u0442\u044C \u0432\u0445\u043E\u0434\u044F\u0442 \u0432\u0445\u043E\u0434\u044F\u0442\u044C \u0432\u044A\u0432 \u0432\u044A\u0437\u0440\u0430\u0441\u0442 \u0432\u044A\u043F\u0440\u0435\u043A\u0438 \u0432\u044A\u0440\u0445\u0443 \u0432\u044B\u0431\u043E\u0440\u0430\u0445 \u0432\u044B\u0431\u043E\u0440\u043E\u0432 \u0432\u044B\u0438\u0433\u0440\u0430\u043B \u0432\u044B\u0438\u0433\u0440\u0430\u043B\u0430 \u0432\u044B\u0439\u0442\u0438 \u0432\u044B\u043D\u0443\u0436\u0434\u0435\u043D \u0432\u044B\u043D\u0456\u043A\u0443 \u0432\u044B\u043F\u0443\u0441\u043A \u0432\u044B\u043F\u0443\u0441\u043A\u0430 \u0432\u044B\u043F\u0443\u0449\u0435\u043D \u0432\u044B\u0440\u043D\u0430\xE7\u043D\u0103 \u0432\u044B\u0441\u043E\u043A\u043E\u0433\u043E \u0432\u044B\u0441\u043E\u043A\u043E\u0439 \u0432\u044B\u0441\u043E\u0442\u0430 \u0432\u044B\u0441\u043E\u0442\u0435 \u0432\u044B\u0441\u043E\u0442\u043E\u0439 \u0432\u044B\u0441\u043E\u0442\u044B \u0432\u044B\u0441\u0442\u0430\u0432\u043A\u0430 \u0432\u044B\u0441\u0442\u0430\u0432\u043A\u0438 \u0432\u044B\u0441\u0442\u0443\u043F\u0430\u0435\u0442 \u0432\u044B\u0441\u0442\u0443\u043F\u0430\u043B \u0432\u044B\u0441\u0442\u0443\u043F\u0430\u0442\u044C \u0432\u044B\u0441\u0442\u0443\u043F\u0438\u043B \u0432\u044B\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u044F \u0432\u044B\u0441\u0448\u0435\u0433\u043E \u0432\u044B\u0441\u0448\u0435\u0439 \u0432\u044B\u0445\u043E\u0434 \u0432\u044B\u0445\u043E\u0434\u0430 \u0432\u044B\u0445\u043E\u0434\u0438\u0442 \u0432\u044B\u0448\u0435 \u0432\u044B\u0448\u0435\u043B \u0432\u044B\u0448\u043B\u0430 \u0432\u044B\u0448\u043B\u0438 \u0432\u0451\u0441\u043A\u0430 \u0432\u0451\u0441\u043A\u0456 \u0432\u0456\u0434 \u0432\u0456\u0434\u0431\u0443\u0432\u0430\u0454\u0442\u044C\u0441\u044F \u0432\u0456\u0434\u0431\u0443\u0432\u0441\u044F \u0432\u0456\u0434\u0431\u0443\u043B\u0430\u0441\u044F \u0432\u0456\u0434\u0431\u0443\u043B\u043E\u0441\u044F \u0432\u0456\u0434\u0434\u0456\u043B\u0435\u043D\u043D\u044F \u0432\u0456\u0434\u0434\u0456\u043B\u0443 \u0432\u0456\u0434\u043A\u0440\u0438\u0442\u0438\u0439 \u0432\u0456\u0434\u043A\u0440\u0438\u0442\u043E \u0432\u0456\u0434\u043A\u0440\u0438\u0442\u0442\u044F \u0432\u0456\u0434\u043C\u0456\u043D\u0443 \u0432\u0456\u0434\u043D\u043E\u0441\u043D\u043E \u0432\u0456\u0434\u043E\u043C\u0430 \u0432\u0456\u0434\u043E\u043C\u0438\u0439 \u0432\u0456\u0434\u043E\u043C\u043E \u0432\u0456\u0434\u043E\u043C\u0456 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0454 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u043D\u043E \u0432\u0456\u0434\u0441\u0442\u0430\u043D\u0456 \u0432\u0456\u0439\u043D\u0430 \u0432\u0456\u0439\u043D\u0438 \u0432\u0456\u0439\u043D\u0456 \u0432\u0456\u0439\u0441\u044C\u043A \u0432\u0456\u0439\u0441\u044C\u043A\u0430 \u0432\u0456\u0439\u0441\u044C\u043A\u043E\u0432\u0438\u0439 \u0432\u0456\u0439\u0441\u044C\u043A\u043E\u0432\u0438\u0445 \u0432\u0456\u0439\u0441\u044C\u043A\u043E\u0432\u043E \u0432\u0456\u0439\u0441\u044C\u043A\u043E\u0432\u043E\u0433\u043E \u0432\u0456\u0439\u0441\u044C\u043A\u043E\u0432\u043E\u0457 \u0432\u0456\u043A\u043E\u043C \u0432\u0456\u043A\u0443 \u0432\u0456\u043D \u0432\u0456\u0446\u0456 \u0433\u0430\u0434\u0430\u0445 \u0433\u0430\u0434\u043E\u045E \u0433\u0430\u0434\u044B \u0433\u0430\u0437 \u0433\u0430\u0437\u0430 \u0433\u0430\u0437\u0430\u0440 \u0433\u0430\u0437\u0435\u0442\u0430 \u0433\u0430\u0437\u0435\u0442\u0435 \u0433\u0430\u0437\u0435\u0442\u0438 \u0433\u0430\u0437\u0435\u0442\u044B \u0433\u0430\u0437\u0443 \u0433\u0430\u043B\u0430\u043A\u0441\u0438\u0438 \u0433\u0430\u043B\u0430\u043A\u0441\u0438\u0438\u0442\u0435 \u0433\u0430\u043B\u0430\u043A\u0441\u0438\u0458\u0430 \u0433\u0430\u043B\u0430\u043A\u0442\u0438\u043A\u0430 \u0433\u0430\u043B\u0430\u043A\u0442\u044B\u043A\u0430 \u0433\u0430\u043B\u0443\u0437\u0456 \u0433\u0430\u043D\u0430 \u0433\u0432\u0430\u0440\u0434\u0435\u0439\u0441\u043A\u043E\u0439 \u0433\u0432\u0430\u0440\u0434\u0438 \u0433\u0432\u0430\u0440\u0434\u0438\u0438 \u0433\u0432\u0430\u0440\u0434\u0438\u044F \u0433\u0434\u0435 \u0433\u0435\u043D\u0430 \u0433\u0435\u043D\u0435\u0440\u0430\u043B \u0433\u0435\u043D\u0435\u0440\u0430\u043B\u0430 \u0433\u0435\u043D\u0435\u0440\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0433\u0435\u043D\u043E\u043C \u0433\u0435\u043D\u04D9 \u0433\u0435\u043E\u0430\u049B\u043F\u0430\u0440\u0430\u0442\u0442\u044B\u049B \u0433\u0435\u043E\u0433\u0440\u0430\u0444\u0438\u0438 \u0433\u0435\u043E\u0433\u0440\u0430\u0444\u0438\u043D \u0433\u0435\u043E\u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u0434\u0438\u043A \u0433\u0435\u043E\u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438 \u0433\u0435\u043E\u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0433\u0435\u0440\u0431 \u0433\u0435\u0440\u0431\u0430 \u0433\u0435\u0440\u0433\u0433\u0430 \u0433\u0435\u0440\u043C\u0430\u043D\u0441\u043A\u0438 \u0433\u0435\u0440\u043E\u0435\u0432 \u0433\u0435\u0440\u043E\u0439 \u0433\u0435\u0440\u043E\u044F \u0433\u0435\u0440\u0446\u043E\u0433 \u0433\u0435\u0440\u0446\u043E\u0433\u0430 \u0433\u0438\u0431\u0435\u043B\u0438 \u0433\u0438\u0434\u0440\u043E\u0442\u0435\u0445\u043D\u0438\u043A \u0433\u0438\u043C\u043D\u0430\u0437\u0438\u0438 \u0433\u0438\u043C\u043D\u0430\u0437\u0438\u044F \u0433\u0438\u0442\u0430\u0440\u0430 \u0433\u043B\u0430\u0432\u0430 \u0433\u043B\u0430\u0432\u0435 \u0433\u043B\u0430\u0432\u0435\u043D \u0433\u043B\u0430\u0432\u043D\u0438 \u0433\u043B\u0430\u0432\u043D\u043E \u0433\u043B\u0430\u0432\u043D\u043E\u0433\u043E \u0433\u043B\u0430\u0432\u043D\u043E\u0439 \u0433\u043B\u0430\u0432\u043D\u044B\u0439 \u0433\u043B\u0430\u0432\u043D\u044B\u043C \u0433\u043B\u0430\u0432\u043D\u044B\u0445 \u0433\u043B\u0430\u0432\u044B \u0433\u043C\u0456\u043D\u0456 \u0433\u043E\u0432\u043E\u0440\u0438 \u0433\u043E\u0432\u043E\u0440\u0438\u0442 \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C \u0433\u043E\u0432\u043E\u0440\u044F\u0442 \u0433\u043E\u0434 \u0433\u043E\u0434\u0430 \u0433\u043E\u0434\u0430\u043C \u0433\u043E\u0434\u0430\u0445 \u0433\u043E\u0434\u0437\u0435 \u0433\u043E\u0434\u0438\u043D\u0430 \u0433\u043E\u0434\u0438\u043D\u0430\u0442\u0430 \u0433\u043E\u0434\u0438\u043D\u0435 \u0433\u043E\u0434\u0438\u043D\u0438 \u0433\u043E\u0434\u0438\u043D\u0443 \u0433\u043E\u0434\u0438\u0448\u043D\u0430 \u0433\u043E\u0434\u043E\u0432 \u0433\u043E\u0434\u043E\u043C \u0433\u043E\u0434\u0443 \u0433\u043E\u0434\u044B \u0433\u043E\u043B \u0433\u043E\u043B\u0430 \u0433\u043E\u043B\u0435\u043C \u0433\u043E\u043B\u0435\u043C\u0430 \u0433\u043E\u043B\u0435\u043C\u0438 \u0433\u043E\u043B\u0435\u043C\u0438\u0442\u0435 \u0433\u043E\u043B\u043E \u0433\u043E\u043B\u043E\u0432 \u0433\u043E\u043B\u043E\u0432\u0430 \u0433\u043E\u043B\u043E\u0432\u0438 \u0433\u043E\u043B\u043E\u0432\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0432\u043D\u0438\u043C \u0433\u043E\u043B\u043E\u0432\u043D\u0438\u0445 \u0433\u043E\u043B\u043E\u0432\u043D\u043E\u0433\u043E \u0433\u043E\u043B\u043E\u0432\u043E\u044E \u0433\u043E\u043B\u043E\u0432\u0443 \u0433\u043E\u043B\u043E\u0441 \u0433\u043E\u043B\u043E\u0441\u043E\u0432 \u0433\u043E\u043B\u044F\u043C \u0433\u043E\u043B\u044F\u043C\u0430 \u0433\u043E\u043B\u044F\u043C\u0430\u0442\u0430 \u0433\u043E\u0440 \u0433\u043E\u0440\u0430 \u0433\u043E\u0440\u0430\u0434 \u0433\u043E\u0440\u0430\u0434\u0430 \u0433\u043E\u0440\u0430\u0434\u0437\u0435 \u0433\u043E\u0440\u0430\u0445 \u0433\u043E\u0440\u0435 \u0433\u043E\u0440\u0438 \u0433\u043E\u0440\u043E\u0434 \u0433\u043E\u0440\u043E\u0434\u0430 \u0433\u043E\u0440\u043E\u0434\u0430\u0445 \u0433\u043E\u0440\u043E\u0434\u0435 \u0433\u043E\u0440\u043E\u0434\u043E\u0432 \u0433\u043E\u0440\u043E\u0434\u043E\u043C \u0433\u043E\u0440\u043E\u0434\u0441\u043A\u0438\u043C \u0433\u043E\u0440\u043E\u0434\u0441\u043A\u0438\u0445 \u0433\u043E\u0440\u043E\u0434\u0441\u043A\u043E\u0433\u043E \u0433\u043E\u0440\u043E\u0434\u0441\u043A\u043E\u0439 \u0433\u043E\u0440\u044B \u0433\u043E\u0441\u043F\u043E\u0434\u0430\u0440\u0441\u0442\u0432\u0430 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0430 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0433\u043E \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u043C \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0445 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u043E \u0433\u0440\u0430\u0432 \u0433\u0440\u0430\u0432\u0446\u0435\u043C \u0433\u0440\u0430\u0434 \u0433\u0440\u0430\u0434\u0430 \u0433\u0440\u0430\u0434\u043E\u0432\u0435 \u0433\u0440\u0430\u0434\u043E\u0442 \u0433\u0440\u0430\u0434\u0443 \u0433\u0440\u0430\u0436\u0434\u0430\u043D \u0433\u0440\u0430\u0436\u0434\u0430\u043D\u0438\u043D \u0433\u0440\u0430\u0436\u0434\u0430\u043D\u0441\u043A\u043E\u0439 \u0433\u0440\u0430\u043D\u0438\u0446 \u0433\u0440\u0430\u043D\u0438\u0446\u0430 \u0433\u0440\u0430\u043D\u0438\u0446\u0435 \u0433\u0440\u0430\u043D\u0438\u0446\u0443 \u0433\u0440\u0430\u043D\u0438\u0446\u044B \u0433\u0440\u0430\u0444 \u0433\u0440\u0430\u0444\u0430 \u0433\u0440\u0430\u0444\u0438\u043D\u044F \u0433\u0440\u0430\u0444\u0441\u0442\u0432\u043E \u0433\u0440\u0435\u043A \u0433\u0440\u0435\u043A\u043E \u0433\u0440\u0435\u0447 \u0433\u0440\u0438 \u0433\u0440\u043E\u043C\u0430\u0434 \u0433\u0440\u043E\u043C\u0430\u0434\u0430 \u0433\u0440\u043E\u043C\u0430\u0434\u0438 \u0433\u0440\u043E\u043C\u0430\u0434\u044F\u043D \u0433\u0440\u0443\u0434\u043D\u044F \u0433\u0440\u0443\u0434\u043D\u0456 \u0433\u0440\u0443\u043F \u0433\u0440\u0443\u043F\u0430 \u0433\u0440\u0443\u043F\u0430\u0442\u0430 \u0433\u0440\u0443\u043F\u0435 \u0433\u0440\u0443\u043F\u0438 \u0433\u0440\u0443\u043F\u0438\u0440\u0430\u043D \u0433\u0440\u0443\u043F\u043F \u0433\u0440\u0443\u043F\u043F\u0430 \u0433\u0440\u0443\u043F\u043F\u0435 \u0433\u0440\u0443\u043F\u043F\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u0443 \u0433\u0440\u0443\u043F\u043F\u044B \u0433\u0440\u0443\u043F\u0443 \u0433\u0440\u0443\u043F\u044B \u0433\u0440\u044A\u0446\u043A\u0438 \u0433\u0443\u0431\u0435\u0440\u043D\u0430\u0442\u043E\u0440 \u0433\u0443\u0431\u0435\u0440\u043D\u0430\u0442\u043E\u0440\u0430 \u0433\u0443\u0431\u0435\u0440\u043D\u0438\u0438 \u0433\u0443\u0431\u0435\u0440\u043D\u0438\u044F \u0433\u0443\u0431\u0435\u0440\u043D\u0456\u0457 \u0433\u0443\u0431\u0438 \u0433\u0443\u043E \u0433\u0443\u0440\u0430\u0445\u044C \u0433\u0443\u0440\u0442 \u0433\u0443\u0440\u0442\u0443 \u0433\u0443\u0441\u0442\u0438\u043D\u0430 \u0433\u0443\u044C\u0439\u0440\u0435 \u0433\u0443\u044C\u0439\u0440\u0435\u043D\u0430\u043D \u0433\u044D\u0434\u044D\u0433 \u0433\u044D\u0436 \u0433\u044D\u0441\u044D\u043D \u0433\u044D\u0442\u0430 \u0433\u044D\u0442\u0430\u0433\u0430 \u0433\u044D\u0442\u0430\u0439 \u0433\u044D\u0442\u044B \u0433\u044D\u0442\u044B\u043C \u0433\u044D\u0445 \u0433\u0456\u0441\u0442\u043E\u0440\u044B\u0456 \u0433\u0456\u0442\u0430\u0440\u0430 \u0434\u0430\u0432 \u0434\u0430\u0432\u0430 \u0434\u0430\u0432\u0435\u0434\u043D\u0456\u043A \u0434\u0430\u0432\u043B\u0430\u0442\u0438\u0438 \u0434\u0430\u0432\u043B\u0430\u0442\u04E3 \u0434\u0430\u0432\u043D\u043E \u0434\u0430\u0434\u0437\u0435\u043D\u044B\u0445 \u0434\u0430\u0436\u0435 \u0434\u0430\u0438\u043C\u0438 \u0434\u0430\u0439\u044B\u043D\u0434\u0430\u0493\u0430\u043D \u0434\u0430\u043A\u044A\u0430 \u0434\u0430\u043B \u0434\u0430\u043B\u0430 \u0434\u0430\u043B\u0435\u0435 \u0434\u0430\u043B\u0435\u043A\u043E \u0434\u0430\u043B\u0438 \u0434\u0430\u043B\u044C\u043D\u0435\u0439\u0448\u0435\u043C \u0434\u0430\u043B\u0456 \u0434\u0430\u043D \u0434\u0430\u043D\u0430 \u0434\u0430\u043D\u0430\u0441 \u0434\u0430\u043D\u0438\u0439 \u0434\u0430\u043D\u0438\u043C\u0438 \u0434\u0430\u043D\u0438\u0445 \u0434\u0430\u043D\u043D\u0438 \u0434\u0430\u043D\u043D\u043E\u0433\u043E \u0434\u0430\u043D\u043D\u043E\u0439 \u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0439 \u0434\u0430\u043D\u043D\u044B\u043C \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u0430\u043D\u0456 \u0434\u0430\u0440 \u0434\u0430\u0440\u0430\u0430 \u0434\u0430\u0440\u044B\u044F \u0434\u0430\u0440\u044B\u044F\u043D\u044B\u043D \u0434\u0430\u0440\u044B\u044F\u0441\u044B\u043D\u044B\u043D \u0434\u0430\u0442\u0430 \u0434\u0430\u0442\u0438 \u0434\u0430\u0445\u0430\u0440\u0430\u043D \u0434\u0430\u0445\u044C \u0434\u0430\u044F\u0440\u0434\u0430\u0433\u0430\u043D \u0434\u0430\u0451\u0442 \u0434\u0430\u0454 \u0434\u0430\u0459\u0435 \u0434\u0432\u0430 \u0434\u0432\u0430\u0436\u0434\u044B \u0434\u0432\u0430\u0442\u0430 \u0434\u0432\u0435 \u0434\u0432\u0435\u0442\u0435 \u0434\u0432\u0438\u0433\u0430\u0442\u0435\u043B\u044F \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F \u0434\u0432\u043E\u0435 \u0434\u0432\u043E\u043C\u0430 \u0434\u0432\u043E\u0440 \u0434\u0432\u043E\u0440\u0430 \u0434\u0432\u043E\u0440\u0435 \u0434\u0432\u043E\u0440\u0435\u0446 \u0434\u0432\u043E\u0440\u043E\u0432 \u0434\u0432\u043E\u0445 \u0434\u0432\u0443\u043C\u044F \u0434\u0432\u0443\u0445 \u0434\u0432\u0456 \u0434\u0432\u0456\u0447\u0456 \u0434\u0435\u0431\u044E\u0442 \u0434\u0435\u0431\u044E\u0442\u0438\u0440\u043E\u0432\u0430\u043B \u0434\u0435\u0431\u044E\u0442\u0443\u0432\u0430\u0432 \u0434\u0435\u0432 \u0434\u0435\u0433\u0435\u043D \u0434\u0435\u0435\u0446 \u0434\u0435\u0439 \u0434\u0435\u0439\u043D\u043E\u0441\u0442 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u0435\u0439\u0456\u043D \u0434\u0435\u0439\u0456\u043D\u0433\u0456 \u0434\u0435\u043A\u0430 \u0434\u0435\u043A\u0430\u0431\u0440\u0435 \u0434\u0435\u043A\u0430\u0431\u0440\u0435\u0445\u044C \u0434\u0435\u043A\u0430\u0431\u0440\u044C \u0434\u0435\u043A\u0430\u0431\u0440\u044F \u0434\u0435\u043A\u0430\u0434\u0435\u0445\u044C \u0434\u0435\u043A\u0435\u043C\u0432\u0440\u0438 \u0434\u0435\u043A\u043B\u0438\u043D\u0430\u0446\u0438\u0458\u0430 \u0434\u0435\u043A\u0456\u043B\u044C\u043A\u0430 \u0434\u0435\u043A\u0456\u043B\u044C\u043A\u043E\u0445 \u0434\u0435\u043B \u0434\u0435\u043B\u0430 \u0434\u0435\u043B\u0430\u0435\u0442 \u0434\u0435\u043B\u0430\u043C \u0434\u0435\u043B\u0435 \u0434\u0435\u043B\u0435\u043D\u0438\u044F \u0434\u0435\u043B\u0438 \u0434\u0435\u043B\u043E \u0434\u0435\u043B\u043E\u0432\u0438 \u0434\u0435\u043B\u043E\u043C \u0434\u0435\u043B\u0443 \u0434\u0435\u043B\u044C \u0434\u0435\u043D \u0434\u0435\u043D\u0435\u0433 \u0434\u0435\u043D\u0435\u0441 \u0434\u0435\u043D\u043E\u0448 \u0434\u0435\u043D\u044C \u0434\u0435\u043D\u044C\u0433\u0438 \u0434\u0435\u043E \u0434\u0435\u043F \u0434\u0435\u043F\u0430\u0440\u0442\u0430\u043C\u0435\u043D\u0442 \u0434\u0435\u043F\u0430\u0440\u0442\u0430\u043C\u0435\u043D\u0442\u0430 \u0434\u0435\u043F\u0430\u0440\u0442\u0430\u043C\u0435\u043D\u0442\u0456\u043D\u0434\u0435 \u0434\u0435\u043F\u0430\u0440\u0442\u0430\u043C\u0435\u043D\u0442\u0456\u043D\u0456\u04A3 \u0434\u0435\u043F\u0430\u0440\u0442\u043C\u0430\u043D\u0443 \u0434\u0435\u043F\u043E \u0434\u0435\u043F\u0443\u0442\u0430\u0442 \u0434\u0435\u043F\u0443\u0442\u0430\u0442\u043E\u0432 \u0434\u0435\u043F\u0443\u0442\u0430\u0442\u043E\u043C \u0434\u0435\u043F\u0443\u0442\u0430\u0442\u044B \u0434\u0435\u043F\u0443\u0442\u0430\u0442\u0456\u0432 \u0434\u0435\u0440 \u0434\u0435\u0440\u0435\u0432 \u0434\u0435\u0440\u0435\u0432\u0430 \u0434\u0435\u0440\u0435\u0432\u0435\u043D\u044C \u0434\u0435\u0440\u0435\u0432\u043D\u0435 \u0434\u0435\u0440\u0435\u0432\u043D\u0438 \u0434\u0435\u0440\u0435\u0432\u043D\u044F \u0434\u0435\u0440\u0435\u0432\u043E \u0434\u0435\u0440\u0436\u0430\u0432 \u0434\u0435\u0440\u0436\u0430\u0432\u0438 \u0434\u0435\u0440\u0436\u0430\u0432\u043D\u0438\u0439 \u0434\u0435\u0440\u0436\u0430\u0432\u043D\u043E\u0433\u043E \u0434\u0435\u0440\u0436\u0430\u0432\u043D\u043E\u0457 \u0434\u0435\u0441\u0435\u0442 \u0434\u0435\u0441\u044F\u0442\u0438 \u0434\u0435\u0441\u044F\u0442\u044C \u0434\u0435\u0442\u0435 \u0434\u0435\u0442\u0435\u0439 \u0434\u0435\u0442\u0438 \u0434\u0435\u0445\u044C\u0430\u0439\u043E\u043B\u0443\u0448 \u0434\u0435\u0446\u0430 \u0434\u0435\u0446\u0430\u0442\u0430 \u0434\u0435\u0446\u0435\u043C\u0431\u0440\u0430 \u0434\u0435\u0448\u0430 \u0434\u0435\u044F\u043A\u0438\u0445 \u0434\u0435\u044F\u043A\u0456 \u0434\u0435\u044F\u0442\u0435\u043B\u044C \u0434\u0435\u044F\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u0434\u0435\u044F\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0434\u0435\u044F\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C\u044E \u0434\u0435\u04B3\u0430 \u0434\u0437\u0435 \u0434\u0437\u044F\u0440\u0436\u0430\u045E\u043D\u0430\u044F \u0434\u0438\u0432\u0438\u0437\u0438\u0438 \u0434\u0438\u0432\u0438\u0437\u0438\u043E\u043D \u0434\u0438\u0432\u0438\u0437\u0438\u043E\u043D\u0430 \u0434\u0438\u0432\u0438\u0437\u0438\u044F \u0434\u0438\u0432\u0456\u0437\u0456\u044F \u0434\u0438\u0432\u0456\u0437\u0456\u0457 \u0434\u0438\u0433\u0430\u0440 \u0434\u0438\u0437\u0430\u0439\u043D \u0434\u0438\u0439\u043D\u0430\u0445\u044C \u0434\u0438\u043A\u0430 \u0434\u0438\u043A\u043A\u0430 \u0434\u0438\u043C\u0435\u043D\u0437\u0438\u0438 \u0434\u0438\u043D\u0430\u043C\u0438\u043A\u0430 \u0434\u0438\u043D\u0430\u043C\u0438\u043A\u0430\u0441\u044B \u0434\u0438\u043D\u0430\u0441\u0442\u0438\u0438 \u0434\u0438\u043D\u0430\u0441\u0442\u0456\u0457 \u0434\u0438\u043F \u0434\u0438\u043F\u043B\u043E\u043C \u0434\u0438\u043F\u043B\u043E\u043C\u0430\u0442 \u0434\u0438\u0440\u0435\u043A\u0442\u043D\u043E \u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440 \u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440\u0430 \u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440\u043E\u043C \u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440\u044B \u0434\u0438\u0441\u043A \u0434\u0438\u0441\u043A\u0430 \u0434\u0438\u0441\u0441\u0435\u0440\u0442\u0430\u0446\u0438\u044E \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u0438 \u0434\u0438\u0442\u0442\u0430\u0448 \u0434\u0438\u0458\u0430\u043C\u0435\u0442\u0430\u0440 \u0434\u043B\u0430\u0431\u043E\u043A\u043E\u0442\u043E \u0434\u043B\u0438\u043D\u0430 \u0434\u043B\u0438\u043D\u043E\u0439 \u0434\u043B\u044F \u0434\u043D\u0435\u0439 \u0434\u043D\u0435\u0441 \u0434\u043D\u0438 \u0434\u043D\u044F \u0434\u043D\u0456 \u0434\u043D\u0456\u0432 \u0434\u043E\u0431\u0430 \u0434\u043E\u0431\u0438 \u0434\u043E\u0431\u0438\u043B\u0430 \u0434\u043E\u0431\u0438\u043E \u0434\u043E\u0431\u0440\u0430 \u0434\u043E\u0431\u0440\u0435 \u0434\u043E\u0431\u0440\u043E \u0434\u043E\u0431\u044A\u0440 \u0434\u043E\u0432\u0436\u0438\u043D\u0430 \u0434\u043E\u0432\u0436\u0438\u043D\u043E\u044E \u0434\u043E\u0432\u043E\u043B\u044C\u043D\u043E \u0434\u043E\u0432\u0445\u0430 \u0434\u043E\u0433\u043E\u0432\u043E\u0440 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 \u0434\u043E\u0434 \u0434\u043E\u0434\u0435\u043A\u0430 \u0434\u043E\u0437\u0432\u043E\u043B\u044F\u0454 \u0434\u043E\u043A \u0434\u043E\u043A\u0430\u0442\u043E \u0434\u043E\u043A\u0442\u043E\u0440 \u0434\u043E\u043A\u0442\u043E\u0440\u0430 \u0434\u043E\u043A\u0442\u043E\u0440\u044B \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0434\u043E\u043B\u0430\u0437\u0438 \u0434\u043E\u043B\u0430\u0440\u0430 \u0434\u043E\u043B\u0430\u0440\u0456\u0432 \u0434\u043E\u043B\u0433\u043E \u0434\u043E\u043B\u0436\u0435\u043D \u0434\u043E\u043B\u0436\u043D\u0430 \u0434\u043E\u043B\u0436\u043D\u043E \u0434\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u0438 \u0434\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C \u0434\u043E\u043B\u0436\u043D\u044B \u0434\u043E\u043B\u043B\u0430\u0440\u043E\u0432 \u0434\u043E\u043B\u0443 \u0434\u043E\u043B\u0443\u0448 \u0434\u043E\u043B\u0447\u0443 \u0434\u043E\u043B\u044F \u0434\u043E\u043C \u0434\u043E\u043C\u0430 \u0434\u043E\u043C\u0430\u0448\u043D\u0438\u0445 \u0434\u043E\u043C\u0435 \u0434\u043E\u043C\u043E\u0432 \u0434\u043E\u043C\u043E\u0433\u043E\u0441\u043F\u043E\u0434\u0430\u0440\u0441\u0442\u0432 \u0434\u043E\u043C\u043E\u0439 \u0434\u043E\u043C\u0443 \u0434\u043E\u043D\u0438\u0448\u043D\u043E\u043C\u0430\u0438 \u0434\u043E\u043F \u0434\u043E\u043F\u043E\u043C\u043E\u0433\u0438 \u0434\u043E\u043F\u043E\u043C\u043E\u0433\u043E\u044E \u0434\u043E\u043F\u043E\u043C\u043E\u0433\u0443 \u0434\u043E\u0440\u0430\u0434 \u0434\u043E\u0440\u0438 \u0434\u043E\u0440\u043E\u0433 \u0434\u043E\u0440\u043E\u0433\u0430 \u0434\u043E\u0440\u043E\u0433\u0435 \u0434\u043E\u0440\u043E\u0433\u0438 \u0434\u043E\u0441\u0438\u0442\u044C \u0434\u043E\u0441\u043B\u0456\u0434\u0436\u0435\u043D\u043D\u044F \u0434\u043E\u0441\u043B\u0456\u0434\u0436\u0435\u043D\u044C \u0434\u043E\u0441\u0442\u0430 \u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0434\u043E\u0441\u0442\u0438\u0433\u0430 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F \u0434\u043E\u0441\u0442\u0443\u043F \u0434\u043E\u0441\u044F\u0433\u043D\u0435\u043D\u043D\u044F \u0434\u043E\u0445\u0438\u043B \u0434\u043E\u0445\u043A \u0434\u043E\u0445\u043E\u0434 \u0434\u043E\u0445\u043E\u0434\u0456\u0432 \u0434\u043E\u0446\u0435\u043D\u0442 \u0434\u043E\u0447\u0435\u0440\u0438 \u0434\u043E\u0447\u044C \u0434\u043E\u0448\u043B\u043E \u0434\u043E\u044C\u0437\u043D\u0430 \u0434\u0440\u0430\u043C\u0430 \u0434\u0440\u0430\u043C\u0430\u0442\u0443\u0440\u0433 \u0434\u0440\u0435\u0432\u043D\u0438\u0445 \u0434\u0440\u0436\u0430\u0432\u0430 \u0434\u0440\u0436\u0430\u0432\u0435 \u0434\u0440\u0436\u0430\u0432\u0438 \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430 \u0434\u0440\u0443\u0433\u0435 \u0434\u0440\u0443\u0433\u0438 \u0434\u0440\u0443\u0433\u0438\u0435 \u0434\u0440\u0443\u0433\u0438\u0439 \u0434\u0440\u0443\u0433\u0438\u043C \u0434\u0440\u0443\u0433\u0438\u043C\u0438 \u0434\u0440\u0443\u0433\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u0438\u0445 \u0434\u0440\u0443\u0433\u043E \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u0434\u0440\u0443\u0433\u043E\u0435 \u0434\u0440\u0443\u0433\u043E\u0439 \u0434\u0440\u0443\u0433\u043E\u043C \u0434\u0440\u0443\u0433\u043E\u043C\u0443 \u0434\u0440\u0443\u0433\u043E\u0457 \u0434\u0440\u0443\u0433\u0443 \u0434\u0440\u0443\u0433\u0456\u0439 \u0434\u0440\u0443\u0436\u0438\u043D\u0430 \u0434\u0443\u0431\u043E\u043A\u043E\u0433 \u0434\u0443\u0436\u0435 \u0434\u0443\u043A\u0445\u0430 \u0434\u0443\u043A\u0445\u0430\u043B\u043B\u0430 \u0434\u0443\u043A\u0445\u0430\u043B\u043B\u0438\u043D \u0434\u0443\u043C\u043A\u0443 \u0434\u0443\u0440\u0438 \u0434\u0443\u0445 \u0434\u0443\u0448\u0438 \u0434\u0443\u0448\u0443 \u0434\u044A\u043B\u0436\u0438\u043D\u0430 \u0434\u044A\u0440\u0436\u0430\u0432\u0430 \u0434\u044A\u0449\u0435\u0440\u044F \u0434\u044D\u044D\u0440 \u0434\u0456\u0439 \u0434\u0456\u0442\u0435\u0439 \u0434\u0456\u044F\u043B\u044C\u043D\u043E\u0441\u0442\u0456 \u0434\u0456\u044F\u043B\u044C\u043D\u0456\u0441\u0442\u044C \u0434\u0456\u044F\u0447 \u0434\u0456\u0457 \u0434\u04D9\u04AF\u043B\u04D9\u0442 \u0435\u0432\u0440\u0435\u0435\u0432 \u0435\u0432\u0440\u043E \u0435\u0432\u0440\u043E\u043F\u0430\u043D \u0435\u0432\u0440\u043E\u043F\u0435\u0439\u0441\u043A\u0438\u0445 \u0435\u0433\u043E \u0435\u0434\u0432\u0430 \u0435\u0434\u0435\u043D \u0435\u0434\u0438\u043D \u0435\u0434\u0438\u043D\u0438\u0446 \u0435\u0434\u0438\u043D\u0438\u0446\u0430 \u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u043C \u0435\u0434\u043D\u0430 \u0435\u0434\u043D\u043E \u0435\u0434\u0456 \u0435\u0436\u0435\u0433\u043E\u0434\u043D\u043E \u0435\u0437\u0438\u043A \u0435\u043A\u0432\u0430\u0442\u043E\u0440 \u0435\u043A\u0438\u043F\u0430 \u0435\u043A\u043B\u0438\u043F\u0442\u0438\u043A\u0430\u0442\u0430 \u0435\u043A\u043E\u043D\u043E\u043C\u0456\u043A\u0438 \u0435\u043A\u0442 \u0435\u043A\u0442\u0430\u045E \u0435\u043A\u044A\u0430 \u0435\u043A\u0456 \u0435\u043A\u0456\u043D\u0448\u0456 \u0435\u043B\u0433\u0430 \u0435\u043B\u0433\u0430\u0441\u044B \u0435\u043B\u0433\u0430\u0441\u044B\u043D\u0430 \u0435\u043B\u0433\u0430\u0441\u044B\u043D\u044B\u04A3 \u0435\u043B\u0433\u044B \u0435\u043B\u0434\u0430 \u0435\u043B\u0434\u0430\u043D \u0435\u043B\u0435\u043C\u0435\u043D\u0442 \u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0438 \u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432 \u0435\u043B\u043B\u0430\u0440\u0434\u0430 \u0435\u043B\u043D\u044B\u04A3 \u0435\u043C\u0435\u0441 \u0435\u043C\u0443 \u0435\u043D\u0433\u043B \u0435\u043D\u0433\u043B\u0435\u0441\u043A\u0438 \u0435\u043D\u0435\u0434\u0456 \u0435\u043F\u0430\u0440\u0445\u0438\u0438 \u0435\u043F\u0430\u0440\u0445\u0438\u044F \u0435\u043F\u0438\u0441\u043A\u043E\u043F \u0435\u043F\u0438\u0441\u043A\u043E\u043F\u0430 \u0435\u043F\u043E\u0445\u0430\u0442\u0430 \u0435\u0440\u0430\u043A\u043B\u044B\u043A\u0442\u0430 \u0435\u0440\u0435\u043A\u0448\u0435 \u0435\u0441\u043B\u0438 \u0435\u0441\u0442\u044C \u0435\u0442\u0435\u0434\u0456 \u0435\u0444\u0435\u043A\u0442 \u0435\u0445\u0430 \u0435\u0449\u0435 \u0435\u0449\u0451 \u0435\u04A3\u0431\u0435\u043A \u0436\u0430\u0439\u0433\u0430\u0448\u043A\u0430\u043D \u0436\u0430\u0439\u044B\u043D\u0434\u0430 \u0436\u0430\u043B\u043F\u044B \u0436\u0430\u043D\u0430 \u0436\u0430\u043D\u0440 \u0436\u0430\u0440\u0438\u044F\u043B\u0430\u043D\u044B\u043C\u0434\u0430\u0440 \u0436\u0430\u0440\u044B\u049B \u0436\u0430\u0441 \u0436\u0430\u0442\u0430\u0434\u044B \u0436\u0430\u0442\u0430\u0442 \u0436\u0430\u0442\u0430\u0442\u044B\u043D \u0436\u0430\u0442\u049B\u0430\u043D \u0436\u0430\u0493\u0430\u043B\u0430\u0443\u044B\u043D\u0430\u043D \u0436\u0430\u0493\u0434\u0430\u0439\u0434\u0430 \u0436\u0430\u0493\u044B\u043D\u0430\u043D \u0436\u0430\u049B\u0441\u044B \u0436\u0430\u04A3\u0430 \u0436\u0435\u043A\u0435 \u0436\u0435\u043B\u0435\u0437\u043D\u043E\u0434\u043E\u0440\u043E\u0436\u043D\u0430\u044F \u0436\u0435\u043B\u0435\u0437\u043D\u043E\u0434\u043E\u0440\u043E\u0436\u043D\u043E\u0439 \u0436\u0435\u043B\u0435\u0437\u043D\u043E\u0439 \u0436\u0435\u043B\u0442\u043E\u049B\u0441\u0430\u043D \u0436\u0435\u043D\u0430 \u0436\u0435\u043D\u0430\u0442 \u0436\u0435\u043D\u0435 \u0436\u0435\u043D\u0438 \u0436\u0435\u043D\u0438\u043B\u0441\u044F \u0436\u0435\u043D\u043E\u0439 \u0436\u0435\u043D\u0449\u0438\u043D \u0436\u0435\u043D\u0449\u0438\u043D\u0430 \u0436\u0435\u043D\u0449\u0438\u043D\u044B \u0436\u0435\u043D\u044B \u0436\u0435\u0440 \u0436\u0435\u0440\u0434\u0435 \u0436\u0435\u0440\u0438 \u0436\u0435\u0440\u0438\u043D\u0434\u0435 \u0436\u0435\u0440\u0442\u0432 \u0436\u0435\u0440\u0456\u043D\u0434\u0435 \u0436\u0438\u0432 \u0436\u0438\u0432\u0435 \u0436\u0438\u0432\u0435\u0435 \u0436\u0438\u0432\u0435\u043B\u043E \u0436\u0438\u0432\u0435\u044F\u0442 \u0436\u0438\u0432\u0438 \u0436\u0438\u0432\u043E\u043F\u0438\u0441\u0438 \u0436\u0438\u0432\u043E\u0442 \u0436\u0438\u0432\u043E\u0442\u0430 \u0436\u0438\u0432\u043E\u0442\u043D\u0438 \u0436\u0438\u0432\u043E\u0442\u043D\u044B\u0445 \u0436\u0438\u0432\u0458\u0435\u043B\u043E \u0436\u0438\u0437\u043D\u0438 \u0436\u0438\u0437\u043D\u044C \u0436\u0438\u043B \u0436\u0438\u043B\u0438 \u0436\u0438\u043B\u0438\u0439\u043D \u0436\u0438\u0442\u0435\u043B\u0435\u0439 \u0436\u0438\u0442\u0435\u043B\u0438 \u0436\u0438\u0442\u0435\u043B\u0456 \u0436\u0438\u0442\u0435\u043B\u0456\u0432 \u0436\u0438\u0442\u0442\u044F \u0436\u0438\u0442\u044C \u0436\u043D\u0456\u045E\u043D\u044F \u0436\u043E\u0432\u0442\u043D\u044F \u0436\u043E\u0432\u0442\u043D\u0456 \u0436\u043E\u043A \u0436\u043E\u043B \u0436\u043E\u043B\u0443 \u0436\u043E\u0493\u0430\u0440\u044B \u0436\u043E\u049B \u0436\u0443\u0440\u043D\u0430\u043B \u0436\u0443\u0440\u043D\u0430\u043B\u0430 \u0436\u0443\u0440\u043D\u0430\u043B\u0435 \u0436\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442 \u0436\u0443\u0440\u043D\u0430\u043B\u0443 \u0436\u044B\u043B \u0436\u044B\u043B\u0434\u0430\u043D \u0436\u044B\u043B\u0434\u0430\u0440\u044B \u0436\u044B\u043B\u0434\u044B\u043D \u0436\u044B\u043B\u0434\u044B\u04A3 \u0436\u044B\u043B\u044B \u0436\u044B\u043B\u0493\u044B \u0436\u044B\u043D\u044B\u0441\u044B \u0436\u044B\u0445\u0430\u0440\u043E\u045E \u0436\u044B\u0446\u0446\u044F \u0436\u0456\u043D\u043A\u0430 \u0436\u0456\u043D\u043A\u0438 \u0436\u0456\u043D\u043E\u043A \u0436\u04AF\u0437\u0435\u0433\u0435 \u0436\u04AF\u0439\u0435 \u0436\u04B1\u043C\u044B\u0441 \u0436\u04D9\u043D\u0435 \u0436\u04E9\u043D\u0456\u043D\u0434\u0435\u0433\u0456 \u0436\u04E9\u043D\u04AF\u043D\u0434\u04E9 \u0436\u04E9\u043D\u04AF\u043D\u0434\u04E9\u0433\u04AF \u0437\u0430\u0431\u0435\u0437\u043F\u0435\u0447\u0435\u043D\u043D\u044F \u0437\u0430\u0431\u0435\u043B\u0435\u0436\u0430\u043D \u0437\u0430\u0431\u0438\u0432 \u0437\u0430\u0431\u0438\u043B \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u0437\u0430\u0432\u0434\u044F\u043A\u0438 \u0437\u0430\u0432\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0437\u0430\u0432\u0436\u0434\u0438 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u0437\u0430\u0432\u043E\u0434 \u0437\u0430\u0432\u043E\u0434\u0430 \u0437\u0430\u0432\u043E\u0434\u0435 \u0437\u0430\u0432\u043E\u0434\u0443 \u0437\u0430\u0432\u043E\u0435\u0432\u0430\u043B \u0437\u0430\u0432\u0440\u0448\u0438\u043E \u0437\u0430\u0432\u044A\u0440\u0448\u0432\u0430 \u0437\u0430\u0433\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0437\u0430\u0433\u0430\u043B\u044C\u043D\u043E\u043C\u0443 \u0437\u0430\u0433\u0438\u043D\u0443\u0432 \u0437\u0430\u0433\u0440\u0443\u0437\u0456\u0446\u044C \u0437\u0430\u0434\u0430\u0447 \u0437\u0430\u0434\u0430\u0447\u0430 \u0437\u0430\u0434\u0430\u0447\u0438 \u0437\u0430\u0435\u0434\u043D\u043E \u0437\u0430\u0437\u0432\u0438\u0447\u0430\u0439 \u0437\u0430\u0439\u043C\u0430\u0454 \u0437\u0430\u043A\u043E\u043D \u0437\u0430\u043A\u043E\u043D\u0430 \u0437\u0430\u043A\u043E\u043D\u043E\u043C \u0437\u0430\u043A\u043E\u043D\u0443 \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B \u0437\u0430\u043A\u0456\u043D\u0447\u0435\u043D\u043D\u044F \u0437\u0430\u043A\u0456\u043D\u0447\u0438\u0432 \u0437\u0430\u043B \u0437\u0430\u043B\u0430 \u0437\u0430\u043B\u0438\u0432 \u0437\u0430\u043B\u0438\u0432\u0430 \u0437\u0430\u043B\u0456\u0437\u043D\u0438\u0446\u0456 \u0437\u0430\u043C\u0430\u043D\u0430\u0448 \u0437\u0430\u043C\u0435\u0441\u0442\u0438\u0442\u0435\u043B\u0435\u043C \u0437\u0430\u043C\u0435\u0441\u0442\u0438\u0442\u0435\u043B\u044C \u0437\u0430\u043C\u043A\u0430 \u0437\u0430\u043C\u043A\u0443 \u0437\u0430\u043C\u043E\u043A \u0437\u0430\u043C\u0443\u0436 \u0437\u0430\u043C\u0456\u0441\u0442\u044C \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442\u0441\u044F \u0437\u0430\u043D\u0438\u043C\u0430\u043B \u0437\u0430\u043D\u0438\u043C\u0430\u043B\u0441\u044F \u0437\u0430\u043D\u0438\u043C\u0430\u0442\u044C\u0441\u044F \u0437\u0430\u043D\u044F\u043B \u0437\u0430\u043D\u044F\u043B\u0430 \u0437\u0430\u043F\u0430\u0434 \u0437\u0430\u043F\u0430\u0434\u0430 \u0437\u0430\u043F\u0430\u0434\u0435 \u0437\u0430\u043F\u0430\u0434\u043D\u0435\u0435 \u0437\u0430\u043F\u0430\u0434\u043D\u043E \u0437\u0430\u043F\u0430\u0434\u043D\u043E\u0439 \u0437\u0430\u043F\u0430\u0434\u043D\u043E\u043C \u0437\u0430\u043F\u0430\u0434\u0443 \u0437\u0430\u043F\u0438\u0441\u0438 \u0437\u0430\u043F\u0438\u0441\u044C \u0437\u0430\u043F\u043E\u0447\u0432\u0430 \u0437\u0430\u043F\u043E\u0447\u0432\u0430\u0442 \u0437\u0430\u0440\u0430\u0434\u0438 \u0437\u0430\u0440\u0430\u0437 \u0437\u0430\u0441\u043B\u0443\u0433\u0438 \u0437\u0430\u0441\u043B\u0443\u0436\u0435\u043D\u043D\u044B\u0439 \u0437\u0430\u0441\u043D\u043E\u0432\u0430\u043D\u0430 \u0437\u0430\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0439 \u0437\u0430\u0441\u043E\u0431\u0456\u0432 \u0437\u0430\u0441\u0442\u043E\u0441\u0443\u0432\u0430\u043D\u043D\u044F \u0437\u0430\u0441\u0442\u0440\u0430\u0448\u0435\u043D \u0437\u0430\u0441\u0442\u0443\u043F\u043D\u0438\u043A \u0437\u0430\u0442\u0435\u043C \u0437\u0430\u0442\u0438\u043C \u0437\u0430\u0445\u0438\u0441\u0442\u0443 \u0437\u0430\u0445\u043E\u0434\u0456 \u0437\u0430\u0445\u0456\u0434 \u0437\u0430\u0449\u0438\u0442\u0430 \u0437\u0430\u0449\u0438\u0442\u0438\u043B \u0437\u0430\u0449\u0438\u0442\u043D\u0438\u043A \u0437\u0430\u0449\u0438\u0442\u044B \u0437\u0430\u0449\u043E\u0442\u043E \u0437\u0430\u044F\u0432\u0438\u0432 \u0437\u0430\u044F\u0432\u0438\u043B \u0437\u0430\u0458\u0435\u0434\u043D\u043E \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043D\u044F \u0437\u0431\u0438\u0440\u043A\u0438 \u0437\u0431\u043E\u0433 \u0437\u0431\u0440\u043E\u0457 \u0437\u0431\u0456\u0440\u043D\u043E\u0457 \u0437\u0431\u0456\u0440\u043D\u0443 \u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0432\u0430\u043D\u0438\u044F \u0437\u0432\u0430\u043D\u043D\u044F \u0437\u0432\u0435\u0437\u0434\u0430 \u0437\u0432\u0435\u0437\u0434\u044B \u0437\u0432\u0443\u043A \u0437\u0432\u0451\u0437\u0434 \u0437\u0433\u043E\u0434\u043E\u043C \u0437\u0433\u0456\u0434\u043D\u043E \u0437\u0434\u0430\u043D\u0438\u0435 \u0437\u0434\u0430\u043D\u0438\u0438 \u0437\u0434\u0430\u043D\u0438\u0439 \u0437\u0434\u0430\u043D\u0438\u044F \u0437\u0434\u0435\u0441\u044C \u0437\u0434\u043E\u0431\u0443\u0432 \u0437\u0434\u043E\u0440\u043E\u0432 \u0437\u0435\u043C\u0435\u043B\u044C \u0437\u0435\u043C\u043B\u0435 \u0437\u0435\u043C\u043B\u0438 \u0437\u0435\u043C\u043B\u044E \u0437\u0435\u043C\u043B\u044F \u0437\u0435\u043C\u043B\u044F\u0445 \u0437\u0435\u043C\u043B\u0456 \u0437\u0435\u043C\u0458\u0430\u0442\u0430 \u0437\u0435\u043C\u0458\u0438 \u0437\u0435\u043C\u0459\u0435 \u0437\u0435\u0440\u0442\u0442\u0435\u043B\u0443 \u0437\u0435\u0440\u0442\u0442\u0435\u0443 \u0437\u0435\u0440\u0442\u0442\u0435\u0443\u043B\u0435\u0440 \u0437\u043C\u0456\u043D\u0438 \u0437\u043D\u0430\u043A \u0437\u043D\u0430\u043A\u043E\u043C \u0437\u043D\u0430\u0445\u043E\u0434\u0437\u0456\u0446\u0446\u0430 \u0437\u043D\u0430\u0445\u043E\u0434\u0438\u0442\u044C\u0441\u044F \u0437\u043D\u0430\u0445\u043E\u0434\u044F\u0442\u044C\u0441\u044F \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0437\u043D\u0430\u0447\u0438 \u0437\u043D\u0430\u0447\u0438\u0442\u0435\u043B\u043D\u043E \u0437\u043D\u0430\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0437\u043D\u0430\u0447\u043D\u043E \u0437\u043D\u043E\u0432\u0443 \u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u043D\u044F \u0437\u043E\u043A\u0440\u0435\u043C\u0430 \u0437\u043E\u043B\u043E\u0442\u0430 \u0437\u043E\u043B\u043E\u0442\u043E \u0437\u043E\u043B\u043E\u0442\u043E\u0439 \u0437\u043E\u043D\u0430 \u0437\u043E\u043D\u0435 \u0437\u043E\u043D\u0435\u0445\u044C \u0437\u043E\u043D\u0438 \u0437\u043E\u043D\u0443 \u0437\u043E\u043D\u044B \u0437\u0440\u0435\u043D\u0438\u044F \u0437\u0440\u0438\u0442\u0435\u043B\u0435\u0439 \u0437\u0440\u043E\u0431\u0438\u0432 \u0437\u0440\u043E\u0431\u0438\u0442\u0438 \u0437\u0443\u0440 \u0437\u044D\u0440\u044D\u0433 \u0437\u0456\u0433\u0440\u0430\u0432 \u0438\u0430\u043A\u043E \u0438\u0431\u043D \u0438\u0433\u0440 \u0438\u0433\u0440\u0430 \u0438\u0433\u0440\u0430\u0435 \u0438\u0433\u0440\u0430\u0435\u0442 \u0438\u0433\u0440\u0430\u043B \u0438\u0433\u0440\u0430\u0442\u044C \u0438\u0433\u0440\u0430\u0445 \u0438\u0433\u0440\u0430\u0447 \u0438\u0433\u0440\u0435 \u0438\u0433\u0440\u0438 \u0438\u0433\u0440\u043E\u043A \u0438\u0433\u0440\u043E\u043A\u0430 \u0438\u0433\u0440\u043E\u043A\u043E\u0432 \u0438\u0433\u0440\u043E\u043A\u043E\u043C \u0438\u0433\u0440\u0443 \u0438\u0433\u0440\u044B \u0438\u0434\u0435\u0438 \u0438\u0434\u0435\u044F \u0438\u0434\u0451\u0442 \u0438\u0437\u0430 \u0438\u0437\u0431\u043E\u0440\u0438 \u0438\u0437\u0431\u0440\u0430\u043D \u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043D \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430 \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0433\u043E \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0441\u0442\u044C \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0435 \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u043C \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0445 \u0438\u0437\u0434 \u0438\u0437\u0434\u0430\u043D\u0438\u0435 \u0438\u0437\u0434\u0430\u043D\u0438\u044F \u0438\u0437\u0434\u0430\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E \u0438\u0437\u0438\u043B\u0434\u04E9\u04E9 \u0438\u0437\u043B\u0438\u0437\u0430 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0438\u0437\u043C\u0435\u0440\u0435\u043D \u0438\u0437\u043C\u0435\u0452\u0443 \u0438\u0437\u043D\u0430\u0447\u0430\u043B\u044C\u043D\u043E \u0438\u0437\u043D\u0435\u0441\u0443\u0432\u0430 \u0438\u0437\u043D\u043E\u0441 \u0438\u0437\u043D\u043E\u0441\u0438 \u0438\u0437\u043D\u043E\u0441\u0438\u043B\u0430 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u0438\u0437\u043F\u043E\u043B\u0437\u0432\u0430 \u0438\u0437\u043F\u043E\u043B\u0437\u0432\u0430\u0442 \u0438\u0437\u0442\u043E\u043A \u0438\u0437\u0443\u0447\u0435\u043D\u0438\u044F \u0438\u0437\u0447\u0435\u0437\u0432\u0430\u043D\u0435 \u0438\u0439\u043D \u0438\u043A\u0435 \u0438\u043B\u0438 \u0438\u043B\u0438\u043C\u0438\u0439 \u0438\u043B\u043B \u0438\u043C\u0430 \u0438\u043C\u0430\u0430\u0442 \u0438\u043C\u0430\u043B \u0438\u043C\u0430\u043B\u0430 \u0438\u043C\u0430\u043B\u0435 \u0438\u043C\u0430\u043B\u0438 \u0438\u043C\u0430\u043B\u043E \u0438\u043C\u0430\u043E \u0438\u043C\u0430\u0442 \u0438\u043C\u0430\u0458\u0443 \u0438\u043C\u0435 \u0438\u043C\u0435\u0435\u0442 \u0438\u043C\u0435\u0435\u0442\u0441\u044F \u0438\u043C\u0435\u043B \u0438\u043C\u0435\u043B\u0430 \u0438\u043C\u0435\u043B\u0438 \u0438\u043C\u0435\u043D\u0430 \u0438\u043C\u0435\u043D\u0435\u043C \u0438\u043C\u0435\u043D\u0438 \u0438\u043C\u0435\u043D\u043D\u043E \u0438\u043C\u0435\u0442\u043E \u0438\u043C\u0435\u0442\u044C \u0438\u043C\u0435\u044E\u0442 \u0438\u043C\u0435\u044E\u0442\u0441\u044F \u0438\u043C\u0438 \u0438\u043C\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u0438\u043C\u043F\u0435\u0440\u0430\u0442\u043E\u0440\u0430 \u0438\u043C\u043F\u0435\u0440\u0438\u0438 \u0438\u043C\u043F\u0435\u0440\u0438\u044F \u0438\u043C\u044F \u0438\u043D\u0430\u0447\u0435 \u0438\u043D\u0433\u043B \u0438\u043D\u0434\u0435\u043A\u0441 \u0438\u043D\u0434\u0435\u043A\u0441\u0430\u0448 \u0438\u043D\u0434\u0435\u043A\u0441\u044B \u0438\u043D\u0434\u0435\u043A\u0441\u0456 \u0438\u043D\u0436\u0435\u043D\u0435\u0440 \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0435 \u0438\u043D\u043E\u0433\u0434\u0430 \u0438\u043D\u043E\u0441\u0442\u0440\u0430\u043D\u043D\u044B\u0445 \u0438\u043D\u0441\u0442\u0438\u0442\u0443\u0442 \u0438\u043D\u0441\u0442\u0438\u0442\u0443\u0442\u0430 \u0438\u043D\u0441\u0442\u0438\u0442\u0443\u0442\u0435 \u0438\u043D\u0441\u0442\u0438\u0442\u0443\u0442\u044B \u0438\u043D\u0442\u0435\u0440\u0432\u0430\u043B\u043E\u0442 \u0438\u043D\u0442\u0435\u0440\u0432\u044C\u044E \u0438\u043D\u0442\u0435\u0440\u0435\u0441 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044E \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0438\u043D\u04D9 \u0438\u0441\u0435\u043C\u0435 \u0438\u0441\u0435\u043C\u0435\u043D\u0434\u04D9\u0433\u0435 \u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u043C \u0438\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432 \u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u0430 \u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u043E \u0438\u0441\u043B\u0430\u043C \u0438\u0441\u043F \u0438\u0441\u043F\u0430\u043D\u04E3 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043B\u0438\u0441\u044C \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0439 \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u044F \u0438\u0441\u0442\u0435 \u0438\u0441\u0442\u043E \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u043A \u0438\u0441\u0442\u043E\u0440\u0438\u043A\u043E \u0438\u0441\u0442\u043E\u0440\u0438\u0447\u0435\u0441\u043A\u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0438\u0441\u0442\u043E\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u044F\u0442\u0430 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u043E\u0432 \u0438\u0441\u0442\u0440\u0430\u0436\u0443\u0432\u0430\u0447\u0438 \u0438\u0441\u0442\u0440\u0430\u0436\u0443\u0432\u0430\u045A\u0430 \u0438\u0441\u0442\u0440\u0430\u0436\u0443\u0432\u0430\u045A\u0435 \u0438\u0442\u0430\u043B \u0438\u0442\u0430\u043B\u0438\u0430\u043D\u0441\u043A\u0438 \u0438\u0442\u0435\u043B\u04D9 \u0438\u0442\u0435\u043F \u0438\u0442\u043A\u04D9\u043D \u0438\u0442\u043E\u0433\u0430\u043C \u0438\u0442\u043E\u0433\u0435 \u0438\u0442\u04D9 \u0438\u0447\u0438\u043D\u0434\u0435 \u0438\u044E\u043B\u0435 \u0438\u044E\u043B\u044C \u0438\u044E\u043B\u044F \u0438\u044E\u043D\u0435 \u0438\u044E\u043D\u044C \u0438\u044E\u043D\u044F \u0439\u0438\u043D\u0430 \u0439\u043E\u0432\u0445\u0430 \u0439\u043E\u0432\u0445\u0430\u0447\u0443 \u0439\u043E\u0432\u0445\u043E \u0439\u043E\u0433\u043E \u0439\u043E\u043B\u0430\u043D \u0439\u043E\u043B\u0443 \u0439\u043E\u043B\u0443\u0448 \u0439\u043E\u043B\u0447\u0443 \u0439\u043E\u043C\u0443 \u0439\u043E\u0446\u0443 \u0439\u043E\u0447\u0430\u043D\u0430\u0448 \u0439\u044B\u043B \u0439\u044B\u043B\u0434\u0430 \u0439\u044B\u043B\u0434\u0430\u043D \u0439\u044B\u043B\u0434\u0430\u0440\u0499\u0430 \u0439\u044B\u043B\u0434\u044B\u04A3 \u0439\u044B\u043B\u0493\u0430 \u0439\u044B\u043B\u0493\u0430\u04BB\u044B \u0439\u044B\u043B\u0493\u0430\u04BB\u044B\u043D\u044B\u04A3 \u0439\u044B\u043B\u0493\u044B \u0439\u04D9\u043A\u0438 \u0439\u04D9\u0448\u04D9\u0433\u04D9\u043D \u0439\u04D9\u0448\u04D9\u0439 \u043A\u0115\xE7\u0115\u043D \u043A\u0115\u0440\u0435\u0442 \u043A\u0115\u0440\u0438\u0447\u0447\u0435\u043D \u043A\u0430\u0431 \u043A\u0430\u0434\u0430 \u043A\u0430\u0434\u0430\u0441\u0442\u0440\u0430 \u043A\u0430\u0434\u0430\u0441\u0442\u0440\u043B\u0430\u0440\u044B\u043D \u043A\u0430\u0434\u0430\u0441\u0442\u0440\u044B \u043A\u0430\u0434\u0430\u0441\u0442\u0440\u044B\u043D\u044B\u04A3 \u043A\u0430\u0434\u0435 \u043A\u0430\u0434\u04D9\u0440 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u043A\u0430\u0436\u0434\u043E\u0439 \u043A\u0430\u0436\u0434\u043E\u043C \u043A\u0430\u0436\u0434\u044B\u0439 \u043A\u0430\u0436\u0435 \u043A\u0430\u0437 \u043A\u0430\u043A \u043A\u0430\u043A\u043E \u043A\u0430\u043A\u043E\u0439 \u043A\u0430\u043A\u0442\u043E \u043A\u0430\u043B\u0433\u0430\u043D \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440 \u043A\u0430\u043B\u044F \u043A\u0430\u043B\u0456 \u043A\u0430\u043C \u043A\u0430\u043C\u043F\u0430\u043D\u0438\u0438 \u043A\u0430\u043D\u0430\u043B \u043A\u0430\u043D\u0430\u043B\u0430 \u043A\u0430\u043D\u0430\u043B\u0435 \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442 \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u0430 \u043A\u0430\u043D\u0442\u043E\u043D\u0430 \u043A\u0430\u043D\u0446\u044B \u043A\u0430\u043E \u043A\u0430\u043F\u0438\u0442\u0430\u043D \u043A\u0430\u043F\u0438\u0442\u0430\u043D\u0430 \u043A\u0430\u0440 \u043A\u0430\u0440\u0430 \u043A\u0430\u0440\u0430\u0433\u0430\u043D \u043A\u0430\u0440\u0430\u0439\u0442 \u043A\u0430\u0440\u0430\u0442\u0430 \u043A\u0430\u0440\u0434 \u043A\u0430\u0440\u0434\u0430 \u043A\u0430\u0440\u0434\u0430\u0430\u0441\u0442 \u043A\u0430\u0440\u0438\u0435\u0440\u0430 \u043A\u0430\u0440\u0442 \u043A\u0430\u0440\u0442\u0430 \u043A\u0430\u0440\u0442\u0430\u0434\u0430 \u043A\u0430\u0440\u0442\u0430\u0441\u044B\u043D\u0434\u0430 \u043A\u0430\u0440\u0442\u0435 \u043A\u0430\u0440\u0442\u0438\u043D \u043A\u0430\u0440\u0442\u0438\u043D\u0430 \u043A\u0430\u0440\u0442\u0438\u043D\u044B \u043A\u0430\u0440\u0442\u043E\u043B \u043A\u0430\u0440\u0442\u044B \u043A\u0430\u0440\u0448\u044B \u043A\u0430\u0440\u044C\u0435\u0440\u0435 \u043A\u0430\u0440\u044C\u0435\u0440\u0443 \u043A\u0430\u0440\u044C\u0435\u0440\u044B \u043A\u0430\u0441\u043D\u0438\u0458\u0435 \u043A\u0430\u0441\u0442\u0440\u044B\u0447\u043D\u0456\u043A\u0430 \u043A\u0430\u0442\u0430\u043B\u043E\u0433 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0430 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0442\u0430\u0440\u0434\u0430 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0442\u0430\u0493\u044B \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0442\u044B\u04A3 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0443 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u044B\u043D\u0434\u0430 \u043A\u0430\u0442\u0430\u043B\u043E\u0437\u0456 \u043A\u0430\u0442\u0430\u0440\u044B \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0456\u0457 \u043A\u0430\u0442\u043E \u043A\u0430\u0442\u0442\u043E\u043E \u043A\u0430\u0444\u0435 \u043A\u0430\u0444\u0435\u0434\u0440\u0430 \u043A\u0430\u0444\u0435\u0434\u0440\u0438 \u043A\u0430\u0444\u0435\u0434\u0440\u043E\u0439 \u043A\u0430\u0444\u0435\u0434\u0440\u044B \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0435 \u043A\u0430\u0458 \u043A\u0432\u0456\u0442\u043D\u044F \u043A\u0432\u0456\u0442\u043D\u0456 \u043A\u0435\u0437\u0434\u0435 \u043A\u0435\u0437\u0434\u0435\u0441\u0435\u0434\u0456 \u043A\u0435\u0437\u0434\u0435\u0441\u043A\u0435\u043D\u0434\u0456\u043A\u0442\u0435\u043D \u043A\u0435\u0437\u0456\u043D\u0434\u0435 \u043A\u0435\u0439\u0431\u0456\u0440 \u043A\u0435\u0439\u0456\u043D \u043A\u0435\u043B\u0433\u0435\u043D \u043A\u0435\u043B\u0435\u0434\u0456 \u043A\u0435\u043B\u0435\u0441\u0456\u0434\u0435\u0439 \u043A\u0435\u043B\u0438\u043F \u043A\u0435\u043D \u043A\u0435\u043F\u0430\u0440\u0430 \u043A\u0435\u0440\u0435\u043A \u043A\u0435\u0440\u0456\u0432\u043D\u0438\u043A \u043A\u0435\u0440\u0456\u0432\u043D\u0438\u0446\u0442\u0432\u043E\u043C \u043A\u0435\u0448\u0435 \u043A\u0435\u04A3 \u043A\u0438\u0439\u0438\u043D \u043A\u0438\u043B\u0433\u04D9\u043D \u043A\u0438\u043B\u043E\u043C\u0435\u0442\u0440 \u043A\u0438\u043B\u043E\u043C\u0435\u0442\u0440\u0430 \u043A\u0438\u043B\u043E\u043C\u0435\u0442\u0440\u0430\u0445 \u043A\u0438\u043B\u043E\u043C\u0435\u0442\u0440\u0438 \u043A\u0438\u043B\u043E\u043C\u0435\u0442\u0440\u043E\u0432 \u043A\u0438\u043B\u04D9 \u043A\u0438\u043D\u043E \u043A\u0438\u0440\u0435\u0442 \u043A\u0438\u0442 \u043A\u0438\u0448\u0432\u0430\u0440\u0438 \u043A\u0438\u0448\u0438 \u043A\u043B\u0430\u0434\u0431\u0438\u0449\u0435 \u043A\u043B\u0430\u0441 \u043A\u043B\u0430\u0441\u0430 \u043A\u043B\u0430\u0441\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0458\u0430 \u043A\u043B\u0430\u0441\u0441 \u043A\u043B\u0430\u0441\u0441\u0430 \u043A\u043B\u0430\u0441\u0441\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u043A\u043B\u0430\u0441\u0441\u043E\u0432 \u043A\u043B\u0430\u0441\u0443 \u043A\u043B\u0435\u0442\u043A\u0438 \u043A\u043B\u0438\u043C\u0430\u0442 \u043A\u043B\u0438\u043C\u0430\u0442\u0430\u043D \u043A\u043B\u0443\u0431 \u043A\u043B\u0443\u0431\u0430 \u043A\u043B\u0443\u0431\u0435 \u043A\u043B\u0443\u0431\u043E\u043C \u043A\u043B\u0443\u0431\u0443 \u043A\u043B\u0443\u0431\u044B \u043A\u043D\u0438\u0433 \u043A\u043D\u0438\u0433\u0430 \u043A\u043D\u0438\u0433\u0430\u0442\u0430 \u043A\u043D\u0438\u0433\u0435 \u043A\u043D\u0438\u0433\u0438 \u043A\u043D\u0438\u0433\u0443 \u043A\u043D\u044F\u0437\u044C \u043A\u043D\u044F\u0437\u044F \u043A\u043E\u0433\u0430 \u043A\u043E\u0433\u0430\u0442\u043E \u043A\u043E\u0433\u0434\u0430 \u043A\u043E\u0433\u043E \u043A\u043E\u0434 \u043A\u043E\u0434\u0443 \u043A\u043E\u0434\u0443\u0454\u0442\u044C\u0441\u044F \u043A\u043E\u0434\u044B \u043A\u043E\u0435 \u043A\u043E\u0435\u0442\u043E \u043A\u043E\u0436\u0435\u043D \u043A\u043E\u0436\u043D\u043E\u0433\u043E \u043A\u043E\u0438 \u043A\u043E\u0438\u0442\u043E \u043A\u043E\u0439\u0442\u043E \u043A\u043E\u043B \u043A\u043E\u043B\u0430 \u043A\u043E\u043B\u0438 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u0430 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043A\u043E\u043B\u0438\u0448\u043D\u0456\u0439 \u043A\u043E\u043B\u043B\u0435\u0433\u0438\u0438 \u043A\u043E\u043B\u043E \u043A\u043E\u043B\u043E\u043D\u0438\u0438 \u043A\u043E\u043B\u044C\u043A\u0430\u0441\u0446\u044C \u043A\u043E\u043B\u044C\u043E\u0440\u0443 \u043A\u043E\u043C\u0430\u043D\u0434 \u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u0438\u0440 \u043A\u043E\u043C\u0430\u043D\u0434\u0438\u0440\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u0438\u0440\u043E\u043C \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0432\u0430\u043B \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0432\u0430\u043D\u0438\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439 \u043A\u043E\u043C\u0430\u043D\u0434\u0443 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u043A\u043E\u043C\u0430\u043D\u0434\u0456 \u043A\u043E\u043C\u0435 \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u0438 \u043A\u043E\u043C\u0438\u0442\u0435\u0442 \u043A\u043E\u043C\u0438\u0442\u0435\u0442\u0430 \u043A\u043E\u043C\u043C\u0443\u043D\u0430 \u043A\u043E\u043C\u043C\u0443\u043D\u0430\u043B\u0430\u0440\u044B \u043A\u043E\u043C\u043C\u0443\u043D\u044B \u043A\u043E\u043C\u043F \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0435\u0439 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0439 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F \u043A\u043E\u043C\u043F\u0430\u043D\u0456\u044F \u043A\u043E\u043C\u043F\u0430\u043D\u0456\u0457 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0441 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0441\u0430 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0441\u0443 \u043A\u043E\u043C\u043F\u043E\u0437\u0438\u0442\u043E\u0440 \u043A\u043E\u043C\u043F\u043E\u0437\u0438\u0442\u043E\u0440\u0430 \u043A\u043E\u043C\u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u043A\u043E\u043C\u0443\u043D\u0438 \u043A\u043E\u043C\u0456\u0442\u0435\u0442\u0443 \u043A\u043E\u043D \u043A\u043E\u043D\u0435\u0446 \u043A\u043E\u043D\u043A\u0443\u0440\u0441 \u043A\u043E\u043D\u043A\u0443\u0440\u0441\u0430 \u043A\u043E\u043D\u043A\u0443\u0440\u0441\u0435 \u043A\u043E\u043D\u043A\u0443\u0440\u0441\u0443 \u043A\u043E\u043D\u0441 \u043A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u0438 \u043A\u043E\u043D\u0441\u0443\u043B \u043A\u043E\u043D\u0442\u0430\u043A\u0442 \u043A\u043E\u043D\u0442\u0438\u043D\u0435\u043D\u0442\u0430\u043B\u0430\u043D \u043A\u043E\u043D\u0442\u0438\u043D\u0435\u043D\u0442\u0430\u043B\u044C \u043A\u043E\u043D\u0442\u0438\u043D\u0435\u043D\u0442\u0430\u043D \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044E \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044F \u043A\u043E\u043D\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u0438 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u0430 \u043A\u043E\u043D\u0446\u0430 \u043A\u043E\u043D\u0446\u0435 \u043A\u043E\u043D\u0446\u0435\u0440\u0442 \u043A\u043E\u043D\u0446\u0443 \u043A\u043E\u0440 \u043A\u043E\u0440\u0430\u0431\u043B\u0435\u0439 \u043A\u043E\u0440\u0430\u0431\u043B\u0438 \u043A\u043E\u0440\u0430\u0431\u043B\u044C \u043A\u043E\u0440\u0430\u0431\u043B\u044F \u043A\u043E\u0440\u0438\u0441\u0442\u0430\u0442 \u043A\u043E\u0440\u0438\u0441\u0442\u0435 \u043A\u043E\u0440\u0438\u0441\u0442\u0438 \u043A\u043E\u0440\u043E\u043B\u044C \u043A\u043E\u0440\u043E\u043B\u044F \u043A\u043E\u0440\u043E\u043B\u0451\u043C \u043A\u043E\u0440\u043F\u0443\u0441 \u043A\u043E\u0440\u043F\u0443\u0441\u0430 \u043A\u043E\u0440\u043F\u0443\u0441\u0443 \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043A\u043E\u0442\u043E\u0440\u043E\u043C \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043A\u043E\u0442\u043E\u0440\u044B\u043C \u043A\u043E\u0442\u043E\u0440\u044B\u043C\u0438 \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043A\u043E\u0447\u0115 \u043A\u043E\u044C\u043B\u043B\u0430\u0448 \u043A\u043E\u044C\u0440\u0442\u0430 \u043A\u043E\u044F\u0442\u043E \u043A\u043E\u0458 \u043A\u043E\u0458\u0430 \u043A\u043E\u0458\u0435 \u043A\u043E\u0458\u0435\u043C \u043A\u043E\u0458\u0438 \u043A\u043E\u0458\u0438\u043C \u043A\u043E\u0458\u0438\u043C\u0430 \u043A\u043E\u0458\u0438\u0445 \u043A\u043E\u0458\u043E\u0458 \u043A\u043E\u0458\u0443 \u043A\u0440\u0430\u0435 \u043A\u0440\u0430\u0439 \u043A\u0440\u0430\u0439\u043D\u0435 \u043A\u0440\u0430\u0439\u044B \u043A\u0440\u0430\u043B \u043A\u0440\u0430\u0441\u0430\u0432\u0456\u043A\u0430 \u043A\u0440\u0430\u0442\u0435\u0440 \u043A\u0440\u0430\u0442\u043A\u043E \u043A\u0440\u0430\u044E \u043A\u0440\u0430\u044F \u043A\u0440\u0430\u0456\u043D\u044B \u043A\u0440\u0430\u0457\u043D \u043A\u0440\u0430\u0457\u043D\u0430\u0445 \u043A\u0440\u0430\u0457\u043D\u0438 \u043A\u0440\u0430\u0457\u043D\u0456 \u043A\u0440\u0430\u0458 \u043A\u0440\u0430\u0458\u0430 \u043A\u0440\u0430\u0458\u0435\u043C \u043A\u0440\u0430\u0458\u043E\u0442 \u043A\u0440\u0430\u0458\u0443 \u043A\u0440\u0430\u0459 \u043A\u0440\u0430\u0459\u0430 \u043A\u0440\u0435\u043F\u043E\u0441\u0442\u0438 \u043A\u0440\u0435\u043F\u043E\u0441\u0442\u044C \u043A\u0440\u0435\u0441\u0442 \u043A\u0440\u0435\u0441\u0442\u044C\u044F\u043D \u043A\u0440\u0438\u043B\u0430 \u043A\u0440\u0438\u0442\u0435\u0440\u0438\u0443\u043C\u0438 \u043A\u0440\u0438\u0442\u0438\u043A \u043A\u0440\u0438\u0442\u0438\u043A\u0438 \u043A\u0440\u043E\u0432\u0438 \u043A\u0440\u043E\u0437 \u043A\u0440\u043E\u043C\u0435 \u043A\u0440\u0443\u0433 \u043A\u0440\u0443\u043F\u043D\u0435\u0439\u0448\u0438\u0445 \u043A\u0440\u0443\u043F\u043D\u044B\u0435 \u043A\u0440\u0443\u043F\u043D\u044B\u0445 \u043A\u0440\u044A\u0433 \u043A\u0440\u0456\u043C \u043A\u0442\u043E \u043A\u0443\u0431\u043A\u0430 \u043A\u0443\u0434\u0430 \u043A\u0443\u0439\u0433\u0430\u043D \u043A\u0443\u043B\u0442\u0443\u0440\u0430 \u043A\u0443\u043B\u0442\u0443\u0440\u0435 \u043A\u0443\u043B\u044C\u0442\u0443\u0440 \u043A\u0443\u043B\u044C\u0442\u0443\u0440\u0430 \u043A\u0443\u043B\u044C\u0442\u0443\u0440\u0435 \u043A\u0443\u043B\u044C\u0442\u0443\u0440\u0438 \u043A\u0443\u043B\u044C\u0442\u0443\u0440\u043D\u043E\u0433\u043E \u043A\u0443\u043B\u044C\u0442\u0443\u0440\u044B \u043A\u0443\u0440\u0430\u043B\u044B \u043A\u0443\u0440\u0441 \u043A\u0443\u0440\u0441\u0430 \u043A\u0443\u0440\u0441\u044B \u043A\u0443\u0440\u0443\u043B\u0443\u0448\u0442\u0430\u0440\u0434\u044B \u043A\u0443\u0448\u044B\u043B\u0430 \u043A\u0443\u0448\u044B\u043B\u0433\u0430\u043D\u0433\u0430 \u043A\u0443\u0448\u044B\u043B\u0434\u044B\u0433\u044B \u043A\u0443\u0448\u044B\u043B\u0434\u044B\u043A\u043B\u0430\u0440\u044B \u043A\u0443\u0448\u044B\u043B\u044B\u043F \u043A\u0445\u0430\u0447\u0447\u0430\u043B\u0446 \u043A\u0445\u0438\u043D \u043A\u0445\u043E\u043B\u043B\u0430\u043B\u043E \u043A\u0445\u043E\u043B\u043B\u0430\u043C\u0430\u043D \u043A\u0445\u043E\u0447\u0443 \u043A\u0445\u0443\u0437\u0430 \u043A\u0445\u0443\u0437\u0430\u0445\u044C \u043A\u0445\u0443\u044C\u0439\u043B\u0438\u043D\u0430 \u043A\u0445\u0443\u044C\u043B\u0438\u043D\u0430 \u043A\u044A\u0430\u044C\u043C\u043D\u0438\u0439\u043D \u043A\u044A\u0430\u044C\u0441\u0442\u0430 \u043A\u044A\u0434\u0435\u0442\u043E \u043A\u044A\u0438\u043B\u0431\u0430 \u043A\u044A\u0438\u043B\u0431\u0430\u0441\u0435\u0434\u0430 \u043A\u044A\u043C \u043A\u044A\u0441\u043D\u043E \u043A\u044B\u0440\u0430\u0443 \u043A\u044B\u0440\u0433\u044B\u0437 \u043A\u044B\u0440\u0433\u044B\u0437\u0447\u0430 \u043A\u0456\u043B\u044C\u043A\u0430 \u043A\u0456\u043B\u044C\u043A\u043E\u0441\u0442\u0456 \u043A\u0456\u043B\u044C\u043A\u043E\u0445 \u043A\u0456\u043B\u044C\u043A\u0456\u0441\u0442\u044C \u043A\u0456\u043D\u043E \u043A\u0456\u043D\u0446\u044F \u043A\u0456\u043D\u0446\u0456 \u043A\u0456\u0440\u0435\u0434\u0456 \u043A\u045A\u0438\u0433\u0430 \u043A\u04AF\u0437\u04D9\u0442\u0435\u043B\u04D9 \u043A\u04AF\u043D \u043A\u04AF\u043D\u04AF \u043A\u04AF\u043F \u043A\u04AF\u043F\u0447\u0435\u043B\u0435\u043A\u043D\u0435 \u043A\u04AF\u0440\u04D9 \u043A\u04E9\u0437 \u043A\u04E9\u043D\u0435 \u043A\u04E9\u043D\u043D\u0435 \u043A\u04E9\u043F \u043A\u04E9\u043F\u0442\u0435\u0433\u0435\u043D \u043B\u0430\u0439\u043D \u043B\u0430\u043A\u043E\u0442 \u043B\u0430\u043D\u0446\u044E\u0433\u0430 \u043B\u0430\u043F\u0442\u0103\u043A\u0115 \u043B\u0430\u0440\u0430\u0440\u0430\u043D \u043B\u0430\u0440\u0430\u0440\u0446\u0430 \u043B\u0430\u0442 \u043B\u0430\u0442\u0438\u043D\u0441\u043A\u0438 \u043B\u0430\u0443\u0440\u0435\u0430\u0442 \u043B\u0430\u0443\u0440\u0435\u0430\u0442\u044B \u043B\u0430\u044C\u0442\u0442\u0430 \u043B\u0430\u044C\u0442\u0442\u0430\u043D \u043B\u0430\u044C\u0442\u0442\u0430\u0447\u0443 \u043B\u0435\u0432\u043E\u043C \u043B\u0435\u0433\u043A\u043E \u043B\u0435\u0439\u0442\u0435\u043D\u0430\u043D\u0442 \u043B\u0435\u0439\u0442\u0435\u043D\u0430\u043D\u0442\u0430 \u043B\u0435\u043B\u0430\u0448 \u043B\u0435\u043B\u043E \u043B\u0435\u0440\u0440\u0430\u043D\u0430 \u043B\u0435\u0441\u0430 \u043B\u0435\u0442 \u043B\u0435\u0442\u0430 \u043B\u0435\u0442\u0438\u044E \u043B\u0435\u0442\u0438\u044F \u043B\u0435\u0442\u043D\u0438\u0439 \u043B\u0435\u0442\u043D\u0438\u0445 \u043B\u0435\u0442\u043E \u043B\u0435\u0442\u043E\u043C \u043B\u0435\u0447\u0435\u043D\u0438\u044F \u043B\u0435\u045C\u0430 \u043B\u0438\u0431\u043E \u043B\u0438\u0433\u0430 \u043B\u0438\u0433\u0435 \u043B\u0438\u0433\u0438 \u043B\u0438\u0434\u0435\u0440 \u043B\u0438\u043D\u0438\u0438 \u043B\u0438\u043D\u0438\u044F \u043B\u0438\u043F\u043D\u044F \u043B\u0438\u043F\u043D\u0456 \u043B\u0438\u0441\u0442 \u043B\u0438\u0441\u0442\u0430 \u043B\u0438\u0441\u0442\u0438 \u043B\u0438\u0441\u0442\u043E\u043F\u0430\u0434\u0430 \u043B\u0438\u0441\u0442\u043E\u043F\u0430\u0434\u0456 \u043B\u0438\u0442 \u043B\u0438\u0442\u0435\u0440\u0430\u0442\u0443\u0440\u0430 \u043B\u0438\u0442\u0435\u0440\u0430\u0442\u0443\u0440\u0435 \u043B\u0438\u0442\u0435\u0440\u0430\u0442\u0443\u0440\u044B \u043B\u0438\u0446 \u043B\u0438\u0446\u0430 \u043B\u0438\u0446\u0435 \u043B\u0438\u0446\u043E \u043B\u0438\u0447\u043D\u043E \u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438 \u043B\u0438\u0448\u0435 \u043B\u0438\u0448\u044C \u043B\u0443\u0447\u0448\u0435 \u043B\u0443\u0447\u0448\u0438\u0439 \u043B\u0443\u0447\u0448\u0438\u043C \u043B\u0443\u0447\u0448\u0438\u0445 \u043B\u0443\u0447\u0448\u0443\u044E \u043B\u0443\u0453\u0435 \u043B\u044E\u0431\u0432\u0438 \u043B\u044E\u0431\u043E\u0432 \u043B\u044E\u0431\u043E\u0432\u044C \u043B\u044E\u0431\u043E\u0439 \u043B\u044E\u0434\u0435\u0439 \u043B\u044E\u0434\u0438 \u043B\u044E\u0434\u0438\u043D\u0430 \u043B\u044E\u0434\u0438\u043D\u0438 \u043B\u044E\u0434\u044C\u043C\u0438 \u043B\u044E\u0434\u044F\u043C \u043B\u044E\u0442\u0430\u0433\u0430 \u043B\u044E\u0442\u043E\u0433\u043E \u043B\u044E\u0442\u043E\u043C\u0443 \u043B\u0456\u0433\u0438 \u043B\u0456\u0437\u0456 \u043B\u0456\u043A \u043B\u0456\u043A\u0443 \u043B\u0456\u043D\u0456\u0457 \u043B\u0456\u043F\u0435\u043D\u044F \u043B\u0456\u0441\u0442\u0430\u043F\u0430\u0434\u0430 \u043B\u0456\u0442\u0435\u0440\u0430\u0442\u0443\u0440\u0438 \u043B\u0456\u0447\u044B\u0446\u0446\u0430 \u043C\u0115\u0448 \u043C\u0430\u0430\u043B\u044B\u043C\u0430\u0442\u044B \u043C\u0430\u0432 \u043C\u0430\u0433\u0430\u0437\u0438\u043D \u043C\u0430\u0433\u043D\u0438\u0442\u0443\u0434\u0430 \u043C\u0430\u0435 \u043C\u0430\u0439 \u043C\u0430\u0439\u0436\u0435 \u043C\u0430\u0439\u043A\u0430 \u043C\u0430\u0439\u043E\u0440 \u043C\u0430\u0439\u043E\u0440\u0430 \u043C\u0430\u0439\u0445\u044C \u043C\u0430\u043A\u0435\u0434\u043E\u043D\u0441\u043A\u0430 \u043C\u0430\u043A\u0435\u0434\u043E\u043D\u0441\u043A\u0438 \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u043D\u0430\u0442\u0430 \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u043D\u043E\u0458 \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u043C\u0430\u043B \u043C\u0430\u043B\u0430 \u043C\u0430\u043B\u0438 \u043C\u0430\u043B\u043A\u0438 \u043C\u0430\u043B\u043A\u043E \u043C\u0430\u043B\u043E \u043C\u0430\u043B\u0445\u0431\u0430\u043B\u0435\u043D \u043C\u0430\u043B\u0445\u0431\u0430\u043B\u0435\u0445\u044C \u043C\u0430\u043B\u0445\u0431\u0443\u0437\u0430\u043D \u043C\u0430\u043B\u0445\u0431\u0443\u0437\u0435\u0440\u0430 \u043C\u0430\u043C\u043B\u0435\u043A\u0435\u0442\u0442\u0438\u043A \u043C\u0430\u043D\u0430\u0441\u0442\u0438\u0440 \u043C\u0430\u043D\u0430\u0441\u0442\u0438\u0440\u0430 \u043C\u0430\u043D\u0433\u0430\u043B\u0430\u043D \u043C\u0430\u0440\u043A\u0430\u0437\u0438 \u043C\u0430\u0440\u043A\u0438 \u043C\u0430\u0440\u043E\u043A \u043C\u0430\u0440\u0442 \u043C\u0430\u0440\u0442\u0430 \u043C\u0430\u0440\u0442\u0435 \u043C\u0430\u0440\u0448\u0440\u0443\u0442 \u043C\u0430\u0441\u0430 \u043C\u0430\u0441\u0441\u0430\u0448 \u043C\u0430\u0441\u0442\u0430\u0446\u0442\u0432\u0430 \u043C\u0430\u0441\u0442\u0435\u0440 \u043C\u0430\u0442\u0435\u043C\u0430\u0442\u0438\u043A \u043C\u0430\u0442\u0435\u043C\u0430\u0442\u0438\u043A\u0430 \u043C\u0430\u0442\u0435\u043C\u0430\u0442\u0438\u043A\u0438 \u043C\u0430\u0442\u0435\u0440\u0438 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u0430 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u044B \u043C\u0430\u0442\u0435\u0440\u0456\u0430\u043B\u0456\u0432 \u043C\u0430\u0442\u0438 \u043C\u0430\u0442\u0447 \u043C\u0430\u0442\u0447\u0430 \u043C\u0430\u0442\u0447\u0430\u0445 \u043C\u0430\u0442\u0447\u0435 \u043C\u0430\u0442\u0447\u0435\u0439 \u043C\u0430\u0442\u0447\u0456 \u043C\u0430\u0442\u0447\u0456\u0432 \u043C\u0430\u0442\u044C \u043C\u0430\u0447 \u043C\u0430\u0447\u0430 \u043C\u0430\u0448\u0438\u043D \u043C\u0430\u0448\u0438\u043D\u0430 \u043C\u0430\u0448\u0438\u043D\u0438 \u043C\u0430\u0448\u0438\u043D\u044B \u043C\u0430\u044E\u0442\u044C \u043C\u0430\u044F \u043C\u0430\u0454 \u043C\u0430\u0458 \u043C\u0430\u0458\u0430 \u043C\u0430\u0458\u043A\u0430 \u043C\u0430\u045A\u0435 \u043C\u0430\u04B3\u0430\u043B\u043B\u0430\u04B3\u043E\u0438 \u043C\u0435\u0431\u043E\u0448\u0430\u0434 \u043C\u0435\u0434\u0430\u043B \u043C\u0435\u0434\u0430\u043B\u0438 \u043C\u0435\u0434\u0430\u043B\u044C \u043C\u0435\u0434\u0430\u043B\u044C\u044E \u043C\u0435\u0434\u0430\u043B\u044F\u043C\u0438 \u043C\u0435\u0434\u0430\u043B\u0456 \u043C\u0435\u0434\u0438\u0446\u0438\u043D\u0430 \u043C\u0435\u0434\u044B\u044F\u0444\u0430\u0439\u043B\u0430\u045E \u043C\u0435\u0434\u044B\u044F\u0444\u0430\u0439\u043B\u044B \u043C\u0435\u0434\u0456\u0430\u043D\u0430 \u043C\u0435\u0436\u0430\u0445 \u043C\u0435\u0436\u0434\u0443 \u043C\u0435\u0436\u0434\u0443\u043D\u0430\u0440\u043E\u0434\u043D\u043E\u0433\u043E \u043C\u0435\u0436\u0434\u0443\u043D\u0430\u0440\u043E\u0434\u043D\u043E\u0439 \u043C\u0435\u0436\u0434\u0443\u043D\u0430\u0440\u043E\u0434\u043D\u044B\u0445 \u043C\u0435\u0436\u0456 \u043C\u0435\u043A\u0435\u043D\u043D\u0456\u04A3 \u043C\u0435\u043A\u0443\u043D\u0430\u0434 \u043C\u0435\u043B\u0445\u0430\u043D \u043C\u0435\u043C\u043B\u0435\u043A\u0435\u0442\u0442\u0456\u043A \u043C\u0435\u043D \u043C\u0435\u043D\u0435\u0435 \u043C\u0435\u043D\u0435\u043D \u043C\u0435\u043D\u0448 \u043C\u0435\u043D\u0448\u0435 \u043C\u0435\u043D\u044C\u0448\u0435 \u043C\u0435\u043D\u044F \u043C\u0435\u043D\u04D9\u043D \u043C\u0435\u0440\u0435 \u043C\u0435\u0440\u0435\u0436\u0456 \u043C\u0435\u0440\u044B \u043C\u0435\u0441\u0435\u0446 \u043C\u0435\u0441\u0435\u0446\u0430 \u043C\u0435\u0441\u0435\u0446\u0438 \u043C\u0435\u0441\u0442 \u043C\u0435\u0441\u0442\u0430 \u043C\u0435\u0441\u0442\u0430\u0445 \u043C\u0435\u0441\u0442\u0435 \u043C\u0435\u0441\u0442\u043D\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u043D\u043E\u0441\u0442\u0438 \u043C\u0435\u0441\u0442\u043D\u044B\u0445 \u043C\u0435\u0441\u0442\u043E \u043C\u0435\u0441\u0442\u043E\u043C \u043C\u0435\u0441\u0442\u0443 \u043C\u0435\u0441\u0446\u0430 \u043C\u0435\u0441\u044F\u0446 \u043C\u0435\u0441\u044F\u0446\u0430 \u043C\u0435\u0441\u044F\u0446\u0435\u0432 \u043C\u0435\u0442\u0430\u043B \u043C\u0435\u0442\u0430\u043B\u043B \u043C\u0435\u0442\u0430\u0440\u0430 \u043C\u0435\u0442\u043E\u0434 \u043C\u0435\u0442\u043E\u0434\u0430 \u043C\u0435\u0442\u043E\u0434\u0438 \u043C\u0435\u0442\u043E\u0434\u043E\u0432 \u043C\u0435\u0442\u043E\u0434\u043E\u043C \u043C\u0435\u0442\u043E\u0434\u044B \u043C\u0435\u0442\u043E\u044E \u043C\u0435\u0442\u0440 \u043C\u0435\u0442\u0440\u0430 \u043C\u0435\u0442\u0440\u0438 \u043C\u0435\u0442\u0440\u043E \u043C\u0435\u0442\u0440\u043E\u0432 \u043C\u0435\u0442\u0440\u0456\u0432 \u043C\u0435\u0442\u0442\u0438\u0433 \u043C\u0435\u0442\u0442\u0438\u0433\u0430\u043D \u043C\u0435\u0445\u0430\u0448 \u043C\u0435\u0445\u043A\u0430\u043D \u043C\u0435\u0447 \u043C\u0435\u0448\u0430\u0432\u0430\u0434 \u043C\u0435\u0448\u043A\u0430\u043D\u0446\u0456\u0432 \u043C\u0435\u0452\u0443 \u043C\u0435\u0453\u0443 \u043C\u0435\u04A3 \u043C\u0438\u043A\u0440\u043E\u0445\u0430\u0430\u043C\u0430\u0448 \u043C\u0438\u043B\u0438\u043E\u043D\u0430 \u043C\u0438\u043B\u0438\u043E\u043D\u0438 \u043C\u0438\u043B\u043B\u0438 \u043C\u0438\u043B\u043B\u0438\u043E\u043D\u043E\u0432 \u043C\u0438\u043D \u043C\u0438\u043D\u0438 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u043D\u0430\u0442\u0430 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u043D\u043E\u0458 \u043C\u0438\u043D\u0438\u0441\u0442\u0435\u0440\u0441\u0442\u0432\u0438 \u043C\u0438\u043D\u0438\u0441\u0442\u0438\u0440\u043B\u0438\u0433\u0438 \u043C\u0438\u043D\u0438\u0441\u0442\u0440 \u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430 \u043C\u0438\u043D\u0438\u0441\u0442\u0440\u043B\u044B\u0433\u044B \u043C\u0438\u043D\u0438\u0441\u0442\u0440\u043B\u044B\u0493\u044B \u043C\u0438\u043D\u0438\u0441\u0442\u0440\u043B\u0456\u0433\u0456 \u043C\u0438\u043D\u0438\u0441\u0442\u0440\u043E\u043C \u043C\u0438\u043D\u0438\u0441\u0442\u044A\u0440 \u043C\u0438\u043D\u043E\u0442 \u043C\u0438\u043D\u0443\u0442 \u043C\u0438\u043D\u0443\u0442\u0430 \u043C\u0438\u043D\u0443\u0442\u0438 \u043C\u0438\u0440 \u043C\u0438\u0440\u0430 \u043C\u0438\u0440\u0435 \u043C\u0438\u0440\u043E\u0432\u043E\u0439 \u043C\u0438\u0440\u0443 \u043C\u0438\u0441\u0442\u0435\u0446\u0442\u0432 \u043C\u0438\u0441\u0442\u0435\u0446\u0442\u0432\u0430 \u043C\u0438\u0442\u0440\u043E\u043F\u043E\u043B\u0438\u0442 \u043C\u0438\u04A3 \u043C\u043B\u0430\u0434\u0448\u0438\u0439 \u043C\u043B\u043D \u043C\u043B\u0440\u0434 \u043C\u043D\u0435 \u043C\u043D\u0435\u043D\u0438\u0435 \u043C\u043D\u0435\u043D\u0438\u044E \u043C\u043D\u043E\u0433\u0438\u0435 \u043C\u043D\u043E\u0433\u0438\u0445 \u043C\u043D\u043E\u0433\u043E \u043C\u043D\u043E\u0433\u043E\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u044B\u0435 \u043C\u043D\u043E\u0433\u043E\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u044B\u0445 \u043C\u043D\u043E\u0433\u0443 \u043C\u043D\u043E\u0436\u0435\u0441\u0442\u0432\u043E \u043C\u043E\u0432 \u043C\u043E\u0432\u0430 \u043C\u043E\u0432\u0438 \u043C\u043E\u0432\u043E\u044E \u043C\u043E\u0432\u0443 \u043C\u043E\u0432\u044B \u043C\u043E\u0433 \u043C\u043E\u0433\u0430\u0442 \u043C\u043E\u0433\u043B\u0430 \u043C\u043E\u0433\u043B\u0438 \u043C\u043E\u0433\u043B\u043E \u043C\u043E\u0433\u0443 \u043C\u043E\u0433\u0443\u0442 \u043C\u043E\u0434\u0435\u043B \u043C\u043E\u0434\u0435\u043B\u0435\u0439 \u043C\u043E\u0434\u0435\u043B\u0438 \u043C\u043E\u0434\u0435\u043B\u044C \u043C\u043E\u0434\u0435\u043B\u0456 \u043C\u043E\u0436\u0430 \u043C\u043E\u0436\u0430\u0442 \u043C\u043E\u0436\u0430\u0446\u0435 \u043C\u043E\u0436\u0435 \u043C\u043E\u0436\u0435\u0442 \u043C\u043E\u0436\u043B\u0438\u0432\u043E \u043C\u043E\u0436\u043B\u0438\u0432\u043E\u0441\u0442\u0456 \u043C\u043E\u0436\u043B\u0438\u0432\u0456\u0441\u0442\u044C \u043C\u043E\u0436\u043D\u0430 \u043C\u043E\u0436\u043D\u043E \u043C\u043E\u0436\u0443\u0442\u044C \u043C\u043E\u0437\u0433\u0430 \u043C\u043E\u043B\u0435\u043A\u0443\u043B\u044F\u0440\u043D\u0430 \u043C\u043E\u043B\u043E\u0434\u043E\u0433\u043E \u043C\u043E\u043B\u043E\u0434\u043E\u0439 \u043C\u043E\u043B\u043E\u0434\u044B\u0445 \u043C\u043E\u043B\u043E\u0434\u0456 \u043C\u043E\u043C\u0435\u043D\u0442 \u043C\u043E\u043C\u0435\u043D\u0442\u0430 \u043C\u043E\u043C\u0435\u043D\u0442\u0443 \u043C\u043E\u043D\u0430\u0441\u0442\u0438\u0440\u044F \u043C\u043E\u043D\u0430\u0441\u0442\u044B\u0440\u044C \u043C\u043E\u043D\u0430\u0441\u0442\u044B\u0440\u044F \u043C\u043E\u043D\u0435\u0442\u0438 \u043C\u043E\u0440\u0430 \u043C\u043E\u0440\u0435 \u043C\u043E\u0440\u0441\u043A\u0438\u0445 \u043C\u043E\u0440\u0441\u043A\u043E\u0439 \u043C\u043E\u0440\u0444\u043E\u043B\u043E\u0448\u043A\u0430\u0442\u0430 \u043C\u043E\u0440\u044F \u043C\u043E\u0441\u043A\u0432\u0430\u043D \u043C\u043E\u0441\u0442 \u043C\u043E\u0441\u0442\u0430 \u043C\u043E\u0445 \u043C\u0440\u0435\u0436\u0430 \u043C\u0443\u0436 \u043C\u0443\u0436\u0430 \u043C\u0443\u0436\u0435\u0441\u0442\u0432\u043E \u043C\u0443\u0436\u043D\u0456\u0441\u0442\u044C \u043C\u0443\u0436\u0447\u0438\u043D \u043C\u0443\u0436\u0447\u0438\u043D\u044B \u043C\u0443\u0437\u0435\u0435 \u043C\u0443\u0437\u0435\u0439 \u043C\u0443\u0437\u0435\u044E \u043C\u0443\u0437\u0435\u044F \u043C\u0443\u0437\u0438\u043A\u0430 \u043C\u0443\u0437\u0438\u043A\u0438 \u043C\u0443\u0437\u044B\u043A\u0430 \u043C\u0443\u0437\u044B\u043A\u0430\u043B\u044C\u043D\u043E\u0439 \u043C\u0443\u0437\u044B\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043C\u0443\u0437\u044B\u043A\u0430\u043B\u044C\u043D\u044B\u0445 \u043C\u0443\u0437\u044B\u043A\u0438 \u043C\u0443\u0437\u044B\u043A\u0443 \u043C\u0443\u043D\u0438\u0446\u0438\u043F\u0430\u043B\u0434\u044B\u043A \u043C\u0443\u043D\u0438\u0446\u0438\u043F\u0430\u043B\u0434\u044B\u049B \u043C\u0443\u043D\u0438\u0446\u0438\u043F\u0430\u043B\u0438\u0442\u0435\u0442 \u043C\u0443\u043D\u0438\u0446\u0438\u043F\u0430\u043B\u044C \u043C\u0443\u043D\u0438\u0446\u0438\u043F\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043C\u0443\u043D\u0438\u0446\u0438\u043F\u0430\u043B\u044C\u043D\u043E\u0435 \u043C\u0443\u043D\u0438\u0446\u0438\u043F\u0430\u043B\u044C\u043D\u044B\u043C \u043C\u0443\u043D\u0438\u0446\u0438\u043F\u0430\u043B\u044C\u043D\u044B\u0445 \u043C\u0443\u043D\u0456\u0446\u0438\u043F\u0430\u043B\u0456\u0442\u0435\u0442 \u043C\u0443\u043D\u0456\u0446\u0438\u043F\u0430\u043B\u0456\u0442\u0435\u0442\u0456 \u043C\u0443\u0440 \u043C\u0443\u0448\u043A\u0430\u0440\u0430\u0446\u0430 \u043C\u0443\u044C\u0440\u0430\u043D \u043C\u044B\u04A3 \u043C\u044F\u0441\u0442\u043E \u043C\u0456\u0433 \u043C\u0456\u0436 \u043C\u0456\u0436\u043D\u0430\u0440\u043E\u0434\u043D\u0438\u0445 \u043C\u0456\u043D\u0456\u0441\u0442\u0440 \u043C\u0456\u043D\u0456\u0441\u0442\u0440\u0430 \u043C\u0456\u0441\u0442 \u043C\u0456\u0441\u0442\u0430 \u043C\u0456\u0441\u0442\u0438\u0442\u044C \u043C\u0456\u0441\u0442\u0438\u0442\u044C\u0441\u044F \u043C\u0456\u0441\u0442\u043E \u043C\u0456\u0441\u0442\u0456 \u043C\u0456\u0441\u0446\u0435 \u043C\u0456\u0441\u0446\u0435\u0432\u0438\u0445 \u043C\u0456\u0441\u0446\u0435\u0432\u043E\u0433\u043E \u043C\u0456\u0441\u0446\u044C \u043C\u0456\u0441\u0446\u044F \u043C\u0456\u0441\u0446\u0456 \u043C\u0456\u0441\u044C\u043A\u043E\u0433\u043E \u043C\u0456\u0441\u044C\u043A\u043E\u0457 \u043C\u0456\u0441\u044F\u0446\u0456\u0432 \u043C\u0458\u0435\u0441\u0442\u043E \u043C\u0458\u0435\u0441\u0442\u0443 \u043C\u04AF\u043C\u043A\u0456\u043D \u043C\u04AF\u0448\u0435\u0441\u0456 \u043C\u04B1\u043D\u0430\u0439 \u043C\u04D9\u0433\u044A\u043B\u04AF\u043C\u0430\u0442\u043B\u0430\u0440\u044B \u043C\u04D9\u0433\u044A\u043B\u04AF\u043C\u0430\u0442\u044B \u043C\u04D9\u043B\u0456\u043C\u0435\u0442\u0442\u0435\u0440 \u043C\u04D9\u043B\u0456\u043C\u0435\u0442\u0442\u0435\u0440\u0456 \u043C\u04D9\u043B\u0456\u043C\u0435\u0442\u0456 \u043C\u04D9\u0493\u043B\u04AF\u043C\u04D9\u0442\u0435 \u043C\u04D9\u0493\u043B\u04AF\u043C\u04D9\u0442\u0442\u04D9\u0440\u0435 \u043C\u04E9\u043C\u043A\u0438\u043D \u043C\u04E9\u043D \u043D\u0430\u0431\u043E\u0440 \u043D\u0430\u0432\u043A\u043E\u043B\u043E \u043D\u0430\u0432\u0443\u043A \u043D\u0430\u0432\u0447\u0430\u0432\u0441\u044F \u043D\u0430\u0432\u0447\u0430\u043D\u043D\u044F \u043D\u0430\u0432\u0456\u0442\u044C \u043D\u0430\u0433\u0433\u0430\u0445\u044C \u043D\u0430\u0433\u043E\u0440\u043E\u0434\u0436\u0435\u043D\u0438\u0439 \u043D\u0430\u0433\u0440\u0430\u0434\u0430 \u043D\u0430\u0433\u0440\u0430\u0434\u0438 \u043D\u0430\u0433\u0440\u0430\u0434\u0443 \u043D\u0430\u0433\u0440\u0430\u0434\u044B \u043D\u0430\u0433\u0440\u0430\u0436\u0434\u0451\u043D \u043D\u0430\u0434 \u043D\u0430\u0434\u043C\u043E\u0440\u0441\u043A\u0430 \u043D\u0430\u0434\u043C\u043E\u0440\u0441\u043A\u043E\u0458 \u043D\u0430\u0437\u0430\u0434 \u043D\u0430\u0437\u0432\u0430 \u043D\u0430\u0437\u0432\u0430\u043B \u043D\u0430\u0437\u0432\u0430\u043B\u0438 \u043D\u0430\u0437\u0432\u0430\u043D \u043D\u0430\u0437\u0432\u0430\u043D\u0430 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435\u043C \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0439 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u043D\u0430\u0437\u0432\u0430\u043D\u044B \u043D\u0430\u0437\u0432\u0438 \u043D\u0430\u0437\u0432\u043E\u044E \u043D\u0430\u0437\u0432\u0443 \u043D\u0430\u0437\u0438\u0432 \u043D\u0430\u0437\u0438\u0432\u0430\u044E\u0442\u044C \u043D\u0430\u0437\u0438\u0432\u0430\u0454\u0442\u044C\u0441\u044F \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043D\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043D\u0430\u0437\u044B\u0432\u0430\u044E\u0442 \u043D\u0430\u0438\u0431\u043E\u043B\u0435\u0435 \u043D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u043D\u0430\u0439 \u043D\u0430\u0439\u0431\u0456\u043B\u044C\u0448 \u043D\u0430\u0439\u043A\u0440\u0430\u0449\u0438\u0445 \u043D\u0430\u0439\u0442\u0438 \u043D\u0430\u043A\u043E\u043D \u043D\u0430\u043A\u043E\u043D\u0435\u0446 \u043D\u0430\u043B\u0430\u0437\u0435 \u043D\u0430\u043B\u0430\u0437\u0438 \u043D\u0430\u043B\u0435\u0436\u0430\u043B\u043E \u043D\u0430\u043B\u0435\u0436\u0430\u0442\u044C \u043D\u0430\u043B\u0435\u0436\u0438\u0442\u044C \u043D\u0430\u043B\u0438\u0447\u0438\u0435 \u043D\u0430\u043C \u043D\u0430\u043C\u0438\u0440\u0430 \u043D\u0430\u043E\u0453\u0430 \u043D\u0430\u043F\u0430\u0434 \u043D\u0430\u043F\u0438\u0441\u0430\u0432 \u043D\u0430\u043F\u0438\u0441\u0430\u043B \u043D\u0430\u043F\u0438\u0441\u0430\u043D\u0430 \u043D\u0430\u043F\u0440\u0430\u0432\u0438 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0438 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u0430\u043F\u0440\u0438\u043A\u043B\u0430\u0434 \u043D\u0430\u043F\u0440\u0438\u043A\u0456\u043D\u0446\u0456 \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u043D\u0430\u043F\u0440\u044F\u043C\u043A\u0443 \u043D\u0430\u0440 \u043D\u0430\u0440\u0435\u0447\u0435\u043D \u043D\u0430\u0440\u0438\u0447\u0430 \u043D\u0430\u0440\u043C\u0430\u0442\u044B\u045E\u043D\u044B \u043D\u0430\u0440\u043E\u0434 \u043D\u0430\u0440\u043E\u0434\u0430 \u043D\u0430\u0440\u043E\u0434\u0436\u0435\u043D\u043D\u044F \u043D\u0430\u0440\u043E\u0434\u0438\u0432\u0441\u044F \u043D\u0430\u0440\u043E\u0434\u043D\u0438\u0445 \u043D\u0430\u0440\u043E\u0434\u043D\u043E\u0433\u043E \u043D\u0430\u0440\u043E\u0434\u043D\u044B\u0445 \u043D\u0430\u0440\u043E\u0434\u043E\u0432 \u043D\u0430\u0440\u043E\u0434\u0443 \u043D\u0430\u0440\u043E\u0434\u0456\u0432 \u043D\u0430\u0440\u044F\u0434\u0443 \u043D\u0430\u0441 \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u0430\u0433\u0430 \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u0438\u0435 \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u0438\u0435\u043C \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u0438\u0435\u0442\u043E \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u0438\u044F \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u043D\u044B\u0445 \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u043D\u044F \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u044B\u0445 \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u0456 \u043D\u0430\u0441\u0435\u043B\u044C\u043D\u0456\u0446\u0442\u0432\u0430 \u043D\u0430\u0441\u0435\u043B\u0451\u043D\u043D\u044B\u0435 \u043D\u0430\u0441\u0435\u043B\u0451\u043D\u043D\u044B\u0439 \u043D\u0430\u0441\u0435\u043B\u0451\u043D\u043D\u044B\u0445 \u043D\u0430\u0441\u0435\u0459\u0430 \u043D\u0430\u0441\u0435\u0459\u0435 \u043D\u0430\u0441\u0435\u0459\u0435\u043D\u043E \u043D\u0430\u0441\u0435\u0459\u0435\u043D\u043E\u0441\u0442\u0438 \u043D\u0430\u0441\u0435\u0459\u0438\u043C\u0430 \u043D\u0430\u0441\u0435\u0459\u0443 \u043D\u0430\u0441\u043B\u0435\u0434\u0438\u044F \u043D\u0430\u0441\u043B\u0435\u0434\u043D\u0438\u043A \u043D\u0430\u0441\u043B\u0435\u0434\u0441\u0442\u0432\u043E \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0435 \u043D\u0430\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0456 \u043D\u0430\u0443\u043A \u043D\u0430\u0443\u043A\u0430 \u043D\u0430\u0443\u043A\u0435 \u043D\u0430\u0443\u043A\u0438 \u043D\u0430\u0443\u043A\u043E\u0432\u0438\u0445 \u043D\u0430\u0443\u043A\u043E\u0432\u043E \u043D\u0430\u0443\u0447\u043D\u043E \u043D\u0430\u0443\u0447\u043D\u043E\u0433\u043E \u043D\u0430\u0443\u0447\u043D\u043E\u0439 \u043D\u0430\u0443\u0447\u043D\u044B\u0439 \u043D\u0430\u0443\u0447\u043D\u044B\u0445 \u043D\u0430\u0444\u0430\u0440 \u043D\u0430\u0445\u043E\u0434\u0438\u043B\u0430\u0441\u044C \u043D\u0430\u0445\u043E\u0434\u0438\u043B\u0438\u0441\u044C \u043D\u0430\u0445\u043E\u0434\u0438\u043B\u0441\u044F \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u043D\u0430\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u043D\u0430\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043D\u0430\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u043D\u0430\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u043D\u0430\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u043D\u0430\u0446\u0456\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043D\u0430\u0446\u0456\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0457 \u043D\u0430\u0447\u0430\u043B \u043D\u0430\u0447\u0430\u043B\u0430 \u043D\u0430\u0447\u0430\u043B\u0430\u0441\u044C \u043D\u0430\u0447\u0430\u043B\u0435 \u043D\u0430\u0447\u0430\u043B\u0438 \u043D\u0430\u0447\u0430\u043B\u0438\u0441\u044C \u043D\u0430\u0447\u0430\u043B\u043E \u043D\u0430\u0447\u0430\u043B\u043E\u043C \u043D\u0430\u0447\u0430\u043B\u043E\u0441\u044C \u043D\u0430\u0447\u0430\u043B\u043E\u0442\u043E \u043D\u0430\u0447\u0430\u043B\u0441\u044F \u043D\u0430\u0447\u0430\u043B\u0443 \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u0438\u043A \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u0438\u043A\u0430 \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u0438\u043A\u043E\u043C \u043D\u0430\u0447\u0438\u043D \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442 \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442\u0441\u044F \u043D\u0430\u0447\u0438\u043D\u0430\u044F \u043D\u0430\u0448 \u043D\u0430\u0448\u0435\u0439 \u043D\u0430\u0448\u0438 \u043D\u0430\u0448\u0438\u0445 \u043D\u0430\u0458\u0432\u0430\u0436\u043D\u0438\u0442\u0435 \u043D\u0435\u0430\u043A\u0442\u0438\u0432\u043D\u0438\u043C\u0438 \u043D\u0435\u0430\u043A\u0442\u0438\u0432\u043D\u0438\u0445 \u043D\u0435\u0430\u043A\u0442\u0438\u0432\u043D\u044B\u043C\u0438 \u043D\u0435\u0431\u0430 \u043D\u0435\u0431\u0435\u0441\u043D\u0438\u043E\u0442 \u043D\u0435\u0431\u043E \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u043D\u0435\u0433\u0438\u0437\u0433\u0438 \u043D\u0435\u0433\u043E \u043D\u0435\u0433\u043E\u0432\u0430\u0442\u0430 \u043D\u0435\u0433\u043E\u0432\u0438\u043E\u0442 \u043D\u0435\u0433\u043E\u0432\u0438\u0442\u0435 \u043D\u0435\u0433\u043E\u0432\u043E \u043D\u0435\u0433\u043E\u0432\u043E\u0442\u043E \u043D\u0435\u0433\u0456\u0437\u0433\u0456 \u043D\u0435\u0433\u0456\u0437\u0456\u043D\u0434\u0435 \u043D\u0435\u0434\u0430\u043B\u0435\u043A\u043E \u043D\u0435\u0434\u0435\u043B\u0438 \u043D\u0435\u0434\u0435\u043B\u044E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430\u044F \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438 \u043D\u0435\u0439 \u043D\u0435\u043A\u0430\u043B\u044C\u043A\u0456 \u043D\u0435\u043A\u0435 \u043D\u0435\u043A\u0438 \u043D\u0435\u043A\u043E\u0438 \u043D\u0435\u043A\u043E\u043B\u0438\u043A\u043E \u043D\u0435\u043A\u043E\u043B\u043A\u0443 \u043D\u0435\u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u043D\u0435\u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043D\u0435\u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u043C \u043D\u0435\u043C\u0430 \u043D\u0435\u043C\u0430\u0454 \u043D\u0435\u043C\u0435\u0441\u0435 \u043D\u0435\u043C\u0435\u0446\u043A\u0438\u0439 \u043D\u0435\u043C\u0435\u0446\u043A\u0438\u0445 \u043D\u0435\u043C\u0435\u0446\u043A\u043E\u0433\u043E \u043D\u0435\u043C\u0435\u0446\u043A\u043E\u0439 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u043D\u0435\u043C\u0441\u043A\u0438 \u043D\u0435\u043C\u0443 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E\u0441\u0442\u0438 \u043D\u0435\u043E\u0434\u043D\u043E\u043A\u0440\u0430\u0442\u043D\u043E \u043D\u0435\u043F\u043E\u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0435\u043D\u043D\u043E \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u0438\u0445 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043D\u0435\u0441\u043C\u043E\u0442\u0440\u044F \u043D\u0435\u0442 \u043D\u0435\u0444\u0442\u044C \u043D\u0435\u0448\u0442\u043E \u043D\u0435\u044E \u043D\u0435\u044F \u043D\u0435\u0451 \u043D\u0435\u0457 \u043D\u0438\u0432 \u043D\u0438\u0432\u043D\u0430\u0442\u0430 \u043D\u0438\u0432\u043D\u0438\u0442\u0435 \u043D\u0438\u0432\u043E \u043D\u0438\u0436\u0435 \u043D\u0438\u0436\u0447\u0435 \u043D\u0438\u0437 \u043D\u0438\u0439\u0441\u0430 \u043D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0438\u043C \u043D\u0438\u043C\u0438 \u043D\u0438\u043D\u0456 \u043D\u0438\u0441\u0443 \u043D\u0438\u0445 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0438\u0458\u0435 \u043D\u043E\u0432 \u043D\u043E\u0432\u0430 \u043D\u043E\u0432\u0430\u0442\u0430 \u043D\u043E\u0432\u0430\u044F \u043D\u043E\u0432\u0435 \u043D\u043E\u0432\u0435\u043C\u0431\u0440\u0430 \u043D\u043E\u0432\u0438 \u043D\u043E\u0432\u0438\u0439 \u043D\u043E\u0432\u0438\u043C \u043D\u043E\u0432\u0438\u0445 \u043D\u043E\u0432\u043E\u0433\u043E \u043D\u043E\u0432\u043E\u0435 \u043D\u043E\u0432\u043E\u0439 \u043D\u043E\u0432\u043E\u043C \u043D\u043E\u0432\u043E\u043C\u0443 \u043D\u043E\u0432\u043E\u0457 \u043D\u043E\u0432\u0443 \u043D\u043E\u0432\u0443\u044E \u043D\u043E\u0432\u044B\u0435 \u043D\u043E\u0432\u044B\u0439 \u043D\u043E\u0432\u044B\u043C \u043D\u043E\u0432\u044B\u0445 \u043D\u043E\u0432\u0456 \u043D\u043E\u0433\u0438 \u043D\u043E\u0435\u043C\u0432\u0440\u0438 \u043D\u043E\u043C\u0435\u0440 \u043D\u043E\u043C\u0435\u0440\u0115 \u043D\u043E\u043C\u0435\u0440\u0430 \u043D\u043E\u043C\u0435\u0440\u043E\u043C \u043D\u043E\u043C\u0435\u0440\u044B \u043D\u043E\u043C\u0438 \u043D\u043E\u043C\u0438\u043D\u0430\u0446\u0438\u0438 \u043D\u043E\u043C\u0443\u0440\u0443 \u043D\u043E\u0440\u043C\u0430 \u043D\u043E\u0441\u0438 \u043D\u043E\u0441\u0438\u0442 \u043D\u043E\u0447\u044C \u043D\u043E\u044F\u0431\u0440\u0435 \u043D\u043E\u044F\u0431\u0440\u0435\u0445\u044C \u043D\u043E\u044F\u0431\u0440\u044C \u043D\u043E\u044F\u0431\u0440\u044F \u043D\u043E\u04B3\u0438\u044F\u0438 \u043D\u043E\u04B3\u0438\u044F\u04B3\u043E\u0438 \u043D\u0443\u0436\u043D\u043E \u043D\u044B\u043D\u0435 \u043D\u044B\u0441\u0430\u043D\u0434\u0430\u0440\u044B\u043D\u044B\u04A3 \u043D\u044B\u0441\u0430\u043D\u0434\u044B \u043D\u044B\u0441\u0430\u043D\u044B\u043D\u0430 \u043D\u044B\u04A3 \u043D\u044C\u043E\u0433\u043E \u043D\u044C\u043E\u043C\u0443 \u043D\u044D\u0433 \u043D\u044D\u0433\u044D\u043D \u043D\u044D\u0440 \u043D\u044F\u043A\u043E\u0438 \u043D\u044F\u043A\u043E\u043B\u043A\u043E \u043D\u044F\u043C \u043D\u044F\u043C\u0430 \u043D\u0451\u043C \u043D\u0456\u0436 \u043D\u0456\u0439 \u043D\u0456\u043C \u043D\u04D9\u0442\u0438\u0436\u0435\u0441\u0456\u043D\u0434\u0435 \u043D\u04E9\u043C\u0456\u0440\u0433\u0435 \u043D\u04E9\u043C\u0456\u0440\u0456 \u043E\u0431\u0430 \u043E\u0431\u0430\u0447\u0435 \u043E\u0431\u0435 \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0435\u043D\u0438\u044F \u043E\u0431\u0438\u043A\u043D\u043E\u0432\u0435\u043D\u043E \u043E\u0431\u0438\u0447\u043D\u043E \u043E\u0431\u043B \u043E\u0431\u043B\u0430\xE7\u0115 \u043E\u0431\u043B\u0430\u0434\u0430\u0435\u0442 \u043E\u0431\u043B\u0430\u0434\u043D\u0430\u043D\u043D\u044F \u043E\u0431\u043B\u0430\u0441\u043D\u043E\u0457 \u043E\u0431\u043B\u0430\u0441\u0442 \u043E\u0431\u043B\u0430\u0441\u0442\u0430 \u043E\u0431\u043B\u0430\u0441\u0442\u0430\u043D \u043E\u0431\u043B\u0430\u0441\u0442\u0435\u0439 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u043D\u043E\u0433\u043E \u043E\u0431\u043B\u0430\u0441\u0442\u0442\u0430 \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u043E\u0431\u043B\u0430\u0441\u0442\u044F\u0445 \u043E\u0431\u043B\u0430\u0441\u0442\u0456 \u043E\u0431\u043B\u0438\u043A \u043E\u0431\u043B\u0443\u0441\u0443 \u043E\u0431\u043B\u044B\u0441\u044B \u043E\u0431\u043E\u0432 \u043E\u0431\u043E\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043E\u0431\u043E\u0438\u0445 \u043E\u0431\u043E\u0440\u043E\u043D\u0438 \u043E\u0431\u043E\u0440\u043E\u043D\u0443 \u043E\u0431\u043E\u0440\u043E\u043D\u044B \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F \u043E\u0431\u043E\u0445 \u043E\u0431\u0440\u0430\u0437 \u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D \u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u0435 \u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u0439 \u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u044F\u043C \u043E\u0431\u0440\u0430\u0437\u043E\u043C \u043E\u0431\u0440\u0430\u043D\u0438\u0439 \u043E\u0431\u0440\u0430\u0442\u043D\u043E \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F \u043E\u0431\u0449\u0435\u0433\u043E \u043E\u0431\u0449\u0435\u0439 \u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0433\u043E \u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0445 \u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u043E\u0431\u0449\u0438\u043D\u0430 \u043E\u0431\u0449\u0438\u043D\u0430\u0442\u0430 \u043E\u0431\u0449\u0438\u043D\u044B \u043E\u0431\u0449\u043E \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u043E\u0431\u044A\u0435\u043A\u0442 \u043E\u0431\u044A\u0435\u043A\u0442\u0430 \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432 \u043E\u0431\u044A\u0435\u043A\u0442\u044B\u043D\u044B\u04A3 \u043E\u0431\u044A\u0435\u043A\u0442\u0456\u0441\u0456 \u043E\u0431\u044A\u0435\u043A\u0442\u0456\u0441\u0456\u043D\u0456\u04A3 \u043E\u0431\u044A\u0435\u043A\u0447\u0115\u043D \u043E\u0431\u044A\u044F\u0432\u0438\u043B \u043E\u0431\u044B\u0447\u043D\u043E \u043E\u0431\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0438 \u043E\u0431\u0458\u0435\u043A\u0430\u0442\u0430 \u043E\u0431\u0458\u0435\u043A\u0442 \u043E\u0431\u0458\u0435\u043A\u0442\u0430 \u043E\u0431\u0458\u0435\u043A\u0442\u0438 \u043E\u0431\u0458\u0435\u043A\u0442\u043E\u0442 \u043E\u0432\u0430 \u043E\u0432\u0430\u0430 \u043E\u0432\u0430\u0458 \u043E\u0432\u0435 \u043E\u0432\u0438\u0435 \u043E\u0432\u0438\u0445 \u043E\u0432\u043E \u043E\u0432\u043E\u0433 \u043E\u0432\u043E\u043C \u043E\u0432\u043E\u0458 \u043E\u0433\u043E\u043D\u044C \u043E\u0434\u0430\u043D \u043E\u0434\u0438\u043D \u043E\u0434\u0438\u043D\u0438\u0446\u044F \u043E\u0434\u043D\u0430 \u043E\u0434\u043D\u0430\u043A \u043E\u0434\u043D\u0430\u043A\u043E \u043E\u0434\u043D\u0435 \u043E\u0434\u043D\u0438\u043C \u043E\u0434\u043D\u043E \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043E\u0434\u043D\u043E\u0433\u043E \u043E\u0434\u043D\u043E\u0439 \u043E\u0434\u043D\u043E\u0439\u043C\u0435\u043D\u043D\u0438\u043C \u043E\u0434\u043D\u043E\u043C \u043E\u0434\u043D\u043E\u043C\u0443 \u043E\u0434\u043D\u043E\u0441 \u043E\u0434\u043D\u043E\u0441\u0438 \u043E\u0434\u043D\u043E\u0441\u043D\u043E \u043E\u0434\u043D\u043E\u0441\u0443 \u043E\u0434\u043D\u043E\u0447\u0430\u0441\u043D\u043E \u043E\u0434\u043D\u0443 \u043E\u0434\u043D\u0456\u0454\u044E \u043E\u0434\u043D\u0456\u0454\u0457 \u043E\u0437\u0435\u0440\u0430 \u043E\u0437\u0435\u0440\u043E \u043E\u0437\u043D\u0430\u043A\u0430\u043C\u0430 \u043E\u0437\u043D\u0430\u043A\u0430\u0442\u0430 \u043E\u0437\u043D\u0430\u0447\u0430\u0432\u0430 \u043E\u0437\u043D\u0430\u0447\u0430\u0435\u0442 \u043E\u0437\u043D\u0430\u0447\u0430\u0454 \u043E\u0437\u043D\u0430\u0447\u0435\u043D\u0430 \u043E\u0437\u043E\u0434 \u043E\u0437\u044B\u043D \u043E\u0437\u044B\u043D\u043B\u044B\u0433\u044B \u043E\u043A\u0430\u0437\u0430\u043B\u0430\u0441\u044C \u043E\u043A\u0430\u0437\u0430\u043B\u0438\u0441\u044C \u043E\u043A\u0430\u0437\u0430\u043B\u0441\u044F \u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u043A\u0432\u0438\u0440\u0443 \u043E\u043A\u0435\u0430\u043D \u043E\u043A\u0435\u0430\u043D\u0430 \u043E\u043A\u043E \u043E\u043A\u043E\u043B\u043E \u043E\u043A\u043E\u043B\u0443 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u0438 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043E\u043A\u043E\u043D\u0447\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u043E\u043A\u043E\u043D\u0447\u0438\u043B \u043E\u043A\u0440\u0435\u043C\u0438\u0445 \u043E\u043A\u0440\u0443\u0433 \u043E\u043A\u0440\u0443\u0433\u0115\u043D\u0435 \u043E\u043A\u0440\u0443\u0433\u0430 \u043E\u043A\u0440\u0443\u0433\u0435 \u043E\u043A\u0440\u0443\u0433\u043E\u0432 \u043E\u043A\u0440\u0443\u0433\u043E\u0442 \u043E\u043A\u0440\u0443\u0433\u0443 \u043E\u043A\u0440\u0443\u0433\u0443\u043D\u0430 \u043E\u043A\u0440\u0443\u0433\u044B\u043D\u0434\u0430 \u043E\u043A\u0440\u0443\u0433\u0456 \u043E\u043A\u0440\u0443\u0433\u0456\u043D\u0435 \u043E\u043A\u0440\u0443\u0433\u0456\u043D\u0456\u04A3 \u043E\u043A\u0440\u0443\u0437\u0456 \u043E\u043A\u0440\u044A\u0433 \u043E\u043A\u0442\u043E\u0431\u0440\u0430 \u043E\u043A\u0442\u043E\u043C\u0432\u0440\u0438 \u043E\u043A\u0442\u044F\u0431\u0440\u0435 \u043E\u043A\u0442\u044F\u0431\u0440\u0435\u0445\u044C \u043E\u043A\u0442\u044F\u0431\u0440\u044C \u043E\u043A\u0442\u044F\u0431\u0440\u044F \u043E\u043A\u0443\u0443 \u043E\u043B\u0430\u0440 \u043E\u043B\u0430\u0440\u0434\u044B\u04A3 \u043E\u043B\u043E\u043D \u043E\u043D\u0430 \u043E\u043D\u0434 \u043E\u043D\u0434\u0430 \u043E\u043D\u0438 \u043E\u043D\u043B\u0430\u0439\u043D \u043E\u043D\u043E \u043E\u043D\u043E\u0458 \u043E\u043D\u044B \u043E\u043D\u044B\u04A3 \u043E\u043D\u04B3\u043E \u043E\u043F\u0435\u0440\u0430 \u043E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0438 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0439 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0457 \u043E\u043F\u0435\u0440\u044B \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043E\u043F\u043E\u0434\u0430\u0442\u043A\u043E\u0432\u0430\u043D\u0438\u0445 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u044F \u043E\u043F\u0441\u0435\u0440\u0432\u0430\u0442\u043E\u0440\u0438\u0458\u0430 \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043B \u043E\u043F\u0448\u0442 \u043E\u043F\u0448\u0442\u0438\u043D\u0430 \u043E\u043F\u0448\u0442\u0438\u043D\u0435 \u043E\u043F\u0448\u0442\u0438\u043D\u0438 \u043E\u043F\u044B\u0442 \u043E\u0440\u0430\u043C \u043E\u0440\u0433\u0430\u043D \u043E\u0440\u0433\u0430\u043D\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0458\u0430 \u043E\u0440\u0433\u0430\u043D\u043E\u0432 \u043E\u0440\u0433\u0430\u043D\u044B \u043E\u0440\u0433\u0430\u043D\u0456\u0432 \u043E\u0440\u0433\u0430\u043D\u0456\u0437\u0430\u0446\u0456\u0439 \u043E\u0440\u0433\u0430\u043D\u0456\u0437\u0430\u0446\u0456\u044F \u043E\u0440\u0433\u0430\u043D\u0456\u0437\u0430\u0446\u0456\u0457 \u043E\u0440\u0434\u0435\u043D \u043E\u0440\u0434\u0435\u043D\u0430 \u043E\u0440\u0434\u0435\u043D\u0430\u043C\u0438 \u043E\u0440\u0434\u0435\u043D\u043E\u043C \u043E\u0440\u0434\u0435\u043D\u044B \u043E\u0440\u0438\u0433\u0456\u043D\u0430\u043B\u044C\u043D\u043E\u043C\u0443 \u043E\u0440\u0438\u0433\u0456\u043D\u0430\u043B\u044C\u043D\u0456\u0439 \u043E\u0440\u043A\u0435\u0441\u0442\u0440 \u043E\u0440\u043A\u0435\u0441\u0442\u0440\u0430 \u043E\u0440\u043D\u0430\u043B\u0430\u0441\u0443\u044B \u043E\u0440\u043D\u0430\u043B\u0430\u0441\u049B\u0430\u043D \u043E\u0440\u043D\u044B \u043E\u0440\u0442\u0430 \u043E\u0440\u0442\u0430\u043B\u044B\u0493\u044B \u043E\u0440\u0443\u0434\u0438\u0439 \u043E\u0440\u0443\u0434\u0438\u044F \u043E\u0440\u0443\u0436\u0438\u0435 \u043E\u0440\u0443\u0436\u0438\u044F \u043E\u0440\u0443\u043D \u043E\u0440\u0443\u0441 \u043E\u0440\u0443\u0441\u0447\u0430 \u043E\u0440\u044B\u043D\u0431\u0430\u0441\u0430\u0440\u044B \u043E\u0440\u044B\u0441 \u043E\u0441\u0432\u0435\u043D \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u043E\u0441\u0432\u043E\u0458\u0438\u043E \u043E\u0441\u0432\u0456\u0442\u0438 \u043E\u0441\u0432\u0456\u0442\u0443 \u043E\u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u043E\u0441\u043D\u043E\u0432\u0430 \u043E\u0441\u043D\u043E\u0432\u0430\u043B \u043E\u0441\u043D\u043E\u0432\u0430\u043D \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0438 \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u044F \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u043E \u043E\u0441\u043D\u043E\u0432\u0435 \u043E\u0441\u043D\u043E\u0432\u0438 \u043E\u0441\u043D\u043E\u0432\u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u043D\u0438 \u043E\u0441\u043D\u043E\u0432\u043D\u0438\u043C \u043E\u0441\u043D\u043E\u0432\u043D\u0438\u0445 \u043E\u0441\u043D\u043E\u0432\u043D\u043E \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0433\u043E \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u043C \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u043C\u0443 \u043E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u043E\u0441\u043D\u043E\u0432\u043D\u044B\u043C \u043E\u0441\u043D\u043E\u0432\u043D\u044B\u0445 \u043E\u0441\u043D\u043E\u0432\u0443 \u043E\u0441\u043D\u043E\u0432\u0456 \u043E\u0441\u043E\u0431\u0430 \u043E\u0441\u043E\u0431\u0435\u043D\u043D\u043E \u043E\u0441\u043E\u0431\u0435\u043D\u043D\u043E\u0441\u0442\u0438 \u043E\u0441\u043E\u0431\u0435\u043D\u043E \u043E\u0441\u043E\u0431\u0438 \u043E\u0441\u043E\u0431\u043B\u0438\u0432\u043E \u043E\u0441\u043E\u0431\u043E\u0441\u043F\u043E\u0436\u0438\u0432\u0430\u0447\u0430 \u043E\u0441\u0442\u0430\u0432\u0430 \u043E\u0441\u0442\u0430\u0432\u0430\u043B\u0441\u044F \u043E\u0441\u0442\u0430\u0432\u0438\u043B \u043E\u0441\u0442\u0430\u043B\u0441\u044F \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0445 \u043E\u0441\u0442\u0430\u043D\u043D\u0456 \u043E\u0441\u0442\u0430\u043D\u043D\u0456\u0439 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043E\u0441\u0442\u0440\u0432\u0430 \u043E\u0441\u0442\u0440\u043E\u0432 \u043E\u0441\u0442\u0440\u043E\u0432\u0430 \u043E\u0441\u0442\u0440\u043E\u0432\u0430\u0445 \u043E\u0441\u0442\u0440\u043E\u0432\u0435 \u043E\u0441\u0442\u0440\u043E\u0432\u0438 \u043E\u0441\u0442\u0440\u043E\u0432\u043E\u0432 \u043E\u0441\u0442\u0440\u043E\u0432\u0456 \u043E\u0441\u0442\u0440\u0456\u0432 \u043E\u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043E\u0441\u044B \u043E\u0441\u0456\u0431 \u043E\u0442\u0431\u043E\u0440 \u043E\u0442\u0431\u043E\u0440\u0430 \u043E\u0442\u0432\u0435\u0442 \u043E\u0442\u0434\u0435\u043B \u043E\u0442\u0434\u0435\u043B\u0430 \u043E\u0442\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043E\u0442\u0434\u0435\u043B\u0435\u043D\u0438\u044F \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0435 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0445 \u043E\u0442\u0435\u0446 \u043E\u0442\u043A\u0430\u0437\u0430\u043B\u0441\u044F \u043E\u0442\u043A\u0440\u0438\u0432\u0430 \u043E\u0442\u043A\u0440\u0438\u0435\u043D \u043E\u0442\u043A\u0440\u044B\u0442 \u043E\u0442\u043A\u0440\u044B\u0442\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F \u043E\u0442\u043A\u0443\u0434\u0430 \u043E\u0442\u043B\u0438\u0447\u0430\u0435\u0442\u0441\u044F \u043E\u0442\u043B\u0438\u0447\u0438\u0435 \u043E\u0442\u043D\u043E\u0432\u043E \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0441\u044F \u043E\u0442\u043D\u043E\u0441\u044F\u0442\u0441\u044F \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0435 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0438 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0439 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044E \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u043B\u0441\u044F \u043E\u0442\u0440\u0438\u043C\u0430\u0432 \u043E\u0442\u0440\u0438\u043C\u0430\u043B\u0430 \u043E\u0442\u0440\u0438\u043C\u0430\u043B\u0438 \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043D\u044F \u043E\u0442\u0440\u0438\u043C\u0430\u0442\u0438 \u043E\u0442\u0440\u044F\u0434 \u043E\u0442\u0440\u044F\u0434\u0430 \u043E\u0442\u0441 \u043E\u0442\u0441\u0442\u0430\u0432\u043A\u0443 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u0435 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u043E\u0442\u0446\u0430 \u043E\u0442\u0446\u043E\u043C \u043E\u0442\u044B\u0440\u044B\u043F \u043E\u0444\u0438\u0446\u0435\u0440 \u043E\u0444\u0438\u0446\u0435\u0440\u043E\u0432 \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E \u043E\u0444\u0444 \u043E\u0444\u0456\u0446\u0456\u0439\u043D\u0438\u0445 \u043E\u0444\u0456\u0446\u0456\u0439\u043D\u043E \u043E\u0445\u043E\u0440\u043E\u043D\u0438 \u043E\u0445\u0440\u0430\u043D\u044B \u043E\u0446\u0435\u043D\u043A\u0438 \u043E\u0447\u0435\u043D\u044C \u043E\u0447\u0435\u0440\u0435\u0434\u044C \u043E\u0447\u043A\u0438 \u043E\u0447\u043A\u043E\u0432 \u043E\u0447\u043E\u043B\u0438\u0432 \u043E\u0447\u043E\u043B\u044E\u0432\u0430\u0432 \u043E\u0448\u043E\u043D\u0434\u043E\u0439 \u043E\u0449\u0435 \u043E\u044C\u0440\u0441 \u043E\u044C\u0440\u0441\u0438\u0439 \u043E\u0493\u0430\u043D \u043E\u0499\u043E\u043D\u043B\u043E\u0493\u043E \u043E\u049B\u0443 \u043E\u04A3\u0442\u04AF\u0441\u0442\u0456\u043A \u043F\u0430\u0432\u043E\u0434\u043B\u0435 \u043F\u0430\u0434 \u043F\u0430\u0434\u0447\u0430\u0441 \u043F\u0430\u0437\u043D\u0435\u0439 \u043F\u0430\u0439\u0434\u0430 \u043F\u0430\u0439\u0434\u0430\u043B\u0430\u043D\u0443\u0443 \u043F\u0430\u043A \u043F\u0430\u043A\u0443\u043B\u044C \u043F\u0430\u043C \u043F\u0430\u043C\u044F\u0442\u0438 \u043F\u0430\u043C\u044F\u0442\u043D\u0438\u043A \u043F\u0430\u043C\u044F\u0442\u043D\u0438\u043A\u0430 \u043F\u0430\u043C\u044F\u0442\u043D\u0438\u043A\u043E\u0432 \u043F\u0430\u043C\u044F\u0442\u044C \u043F\u0430\u043C\u0456\u0436 \u043F\u0430\u043F\u0430 \u043F\u0430\u0440 \u043F\u0430\u0440\u0430 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440 \u043F\u0430\u0440\u0430\u049B\u0448\u0430\u0441\u044B \u043F\u0430\u0440\u0438 \u043F\u0430\u0440\u043A \u043F\u0430\u0440\u043A\u0430 \u043F\u0430\u0440\u043A\u0443 \u043F\u0430\u0440\u043B\u0430\u043C\u0435\u043D\u0442 \u043F\u0430\u0440\u043B\u0430\u043C\u0435\u043D\u0442\u0430 \u043F\u0430\u0440\u0442\u0438\u0438 \u043F\u0430\u0440\u0442\u0438\u044E \u043F\u0430\u0440\u0442\u0438\u044F \u043F\u0430\u0440\u0442\u0438\u0458\u0430 \u043F\u0430\u0440\u0442\u0456\u0457 \u043F\u0430\u0440\u044B \u043F\u0430\u0441\u043B\u044F \u043F\u0430\u0442 \u043F\u0430\u0442\u0448\u0430\u043B\u0103\u0445 \u043F\u0430\u0447\u0430\u0442\u043A\u0443 \u043F\u0430\u0447\u0445\u044C\u0430\u043B\u043A\u0445\u0430\u043D \u043F\u0430\u0448\u0430 \u043F\u0435\u0432\u0435\u0446 \u043F\u0435\u0432\u0438\u0446\u0430 \u043F\u0435\u0434\u0430\u0433\u043E\u0433 \u043F\u0435\u0434\u0430\u0433\u043E\u0433\u0438\u043A\u0430 \u043F\u0435\u043D \u043F\u0435\u043D\u0441\u0456\u043E\u043D\u0435\u0440\u0430\u043C\u0438 \u043F\u0435\u0440 \u043F\u0435\u0440\u0430\u043B\u0456\u0447\u0430\u043D\u044B\u0445 \u043F\u0435\u0440\u0432\u0430\u044F \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u043F\u0435\u0440\u0432\u043E\u0435 \u043F\u0435\u0440\u0432\u043E\u0439 \u043F\u0435\u0440\u0432\u043E\u043C \u043F\u0435\u0440\u0432\u043E\u043D\u0430\u0447\u0430\u043B\u044C\u043D\u043E \u043F\u0435\u0440\u0432\u0443\u044E \u043F\u0435\u0440\u0432\u044B\u0435 \u043F\u0435\u0440\u0432\u044B\u0439 \u043F\u0435\u0440\u0432\u044B\u043C \u043F\u0435\u0440\u0432\u044B\u0445 \u043F\u0435\u0440\u0435\u0431\u0443\u0432\u0430\u0432 \u043F\u0435\u0440\u0435\u0432\u0430\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0435 \u043F\u0435\u0440\u0435\u0434 \u043F\u0435\u0440\u0435\u0434\u0430\u0447 \u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0438 \u043F\u0435\u0440\u0435\u0435\u0445\u0430\u043B \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D \u043F\u0435\u0440\u0435\u0439\u0448\u043E\u0432 \u043F\u0435\u0440\u0435\u043C\u043E\u0433\u0443 \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u0438 \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u0443 \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u044C \u043F\u0435\u0440\u0435\u0448\u0451\u043B \u043F\u0435\u0440\u0438\u043E\u0434 \u043F\u0435\u0440\u0438\u043E\u0434\u0430 \u043F\u0435\u0440\u0438\u043E\u0434\u043E\u0442 \u043F\u0435\u0440\u0438\u043E\u0434\u0443 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439 \u043F\u0435\u0440\u0448\u0430 \u043F\u0435\u0440\u0448\u0430\u043A\u0440\u044B\u043D\u0456\u0446\u044B \u043F\u0435\u0440\u0448\u0435 \u043F\u0435\u0440\u0448\u0438\u0439 \u043F\u0435\u0440\u0448\u0438\u043C \u043F\u0435\u0440\u0448\u0438\u0445 \u043F\u0435\u0440\u0448\u043E\u0433\u043E \u043F\u0435\u0440\u0448\u043E\u043C\u0443 \u043F\u0435\u0440\u0448\u043E\u0457 \u043F\u0435\u0440\u0448\u0443 \u043F\u0435\u0440\u0448\u044B \u043F\u0435\u0440\u0448\u0456 \u043F\u0435\u0440\u0448\u0456\u0439 \u043F\u0435\u0440\u044B\u044F\u0434 \u043F\u0435\u0440\u0456\u043E\u0434 \u043F\u0435\u0440\u0456\u043E\u0434\u0443 \u043F\u0435\u0441\u0435\u043D \u043F\u0435\u0441\u043D\u0438 \u043F\u0435\u0441\u043D\u044E \u043F\u0435\u0441\u043D\u044F \u043F\u0435\u0442 \u043F\u0435\u0445\u043E\u0442\u044B \u043F\u0435\u0447\u0430\u0442\u0438 \u043F\u0435\u0447\u0435\u043B\u0438 \u043F\u0438\u043B\u043E\u0442 \u043F\u0438\u0441\u0430\u043B \u043F\u0438\u0441\u0430\u0442\u0435\u043B \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u0435\u0439 \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u044C \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u044F \u043F\u0438\u0441\u043C\u043E \u043F\u0438\u0441\u044C\u043C\u0430 \u043F\u0438\u0441\u044C\u043C\u0435\u043D\u043D\u0438\u043A \u043F\u0438\u0441\u044C\u043C\u043E \u043F\u0438\u0442\u0430\u043D\u043D\u044F \u043F\u0438\u0442\u0430\u043D\u044C \u043F\u0438\u0448\u0435 \u043F\u0438\u0448\u0435\u0442 \u043F\u043B\u0430\u043D \u043F\u043B\u0430\u043D\u0430 \u043F\u043B\u0430\u043D\u0435 \u043F\u043B\u0430\u043D\u0435\u0442\u044B \u043F\u043B\u0430\u043D\u0438\u043D\u0430 \u043F\u043B\u0430\u043D\u0438\u043D\u0430\u0442\u0430 \u043F\u043B\u0430\u043D\u0443 \u043F\u043B\u0430\u0441\u043C\u0430\u043D \u043F\u043B\u0430\u0442\u043E \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u043F\u043B\u0435\u0439 \u043F\u043B\u0435\u043C\u0435\u043D\u0430 \u043F\u043B\u0435\u043D \u043F\u043B\u0435\u0447\u0456 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u043F\u043B\u043E\u0449 \u043F\u043B\u043E\u0449\u0430 \u043F\u043B\u043E\u0449\u0430\u0434\u0438 \u043F\u043B\u043E\u0449\u0430\u0434\u044C \u043F\u043B\u043E\u0449\u0456 \u043F\u043E\u0431\u0435\u0434\u0430 \u043F\u043E\u0431\u0435\u0434\u0438 \u043F\u043E\u0431\u0435\u0434\u0438\u043B \u043F\u043E\u0431\u0435\u0434\u0438\u0442\u0435\u043B\u044C \u043F\u043E\u0431\u0435\u0434\u0443 \u043F\u043E\u0431\u0435\u0434\u044B \u043F\u043E\u0431\u0435\u0440\u0435\u0436\u044C\u0435 \u043F\u043E\u0431\u0435\u0440\u0435\u0436\u044C\u044F \u043F\u043E\u0431\u043B\u0438\u0437\u0443 \u043F\u043E\u0432 \u043F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0432\u0441\u044F \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u0456 \u043F\u043E\u0432\u0435\u0441\u0442\u0438 \u043F\u043E\u0432\u0435\u0447\u0435 \u043F\u043E\u0432\u0435\u0447\u0435\u0442\u043E \u043F\u043E\u0432\u0435\u045C\u0435 \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043F\u043E\u0432\u0438\u043D\u043D\u0456 \u043F\u043E\u0432\u043D\u0456\u0441\u0442\u044E \u043F\u043E\u0432\u043E\u0434\u0443 \u043F\u043E\u0432\u0440\u0448\u0438\u043D\u0430 \u043F\u043E\u0432\u0440\u0448\u0438\u043D\u0438 \u043F\u043E\u0432\u0440\u0448\u0438\u043D\u0441\u043A\u0438\u043E\u0442 \u043F\u043E\u0432\u0441\u0442\u0430\u043D\u043D\u044F \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u043E \u043F\u043E\u0432\u0456\u0442\u0440\u044F \u043F\u043E\u0432\u0456\u0442\u0443 \u043F\u043E\u0432\u0456\u0442\u0456 \u043F\u043E\u0433\u0438\u0431 \u043F\u043E\u0433\u0438\u0431\u043B\u0438 \u043F\u043E\u0434 \u043F\u043E\u0434\u0430\u0442\u043E\u0446\u0438 \u043F\u043E\u0434\u0430\u0446\u0438 \u043F\u043E\u0434\u0430\u0446\u0438\u043C\u0430 \u043F\u043E\u0434\u0431\u0430\u0441\u0441\u0435\u0439\u043D \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0438 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0443 \u043F\u043E\u0434\u0435\u043B\u0431\u0430 \u043F\u043E\u0434\u043E\u0446\u043D\u0430 \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043B \u043F\u043E\u0434\u043F\u043E\u043B\u043A\u043E\u0432\u043D\u0438\u043A \u043F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u044F \u043F\u043E\u0434\u0440\u0443\u0447\u0458\u0430 \u043F\u043E\u0434\u0440\u0443\u0447\u0458\u0443 \u043F\u043E\u0434\u0440\u044F\u0434 \u043F\u043E\u0434\u0456\u0439 \u043F\u043E\u0434\u0456\u0457 \u043F\u043E\u0435\u0442 \u043F\u043E\u0437\u0432\u043E\u043B\u0438\u043B\u043E \u043F\u043E\u0437\u0432\u043E\u043B\u044F\u0435\u0442 \u043F\u043E\u0437\u0434\u043D\u0435\u0435 \u043F\u043E\u0437\u0436\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u043F\u043E\u0437\u0438\u0446\u0438\u044E \u043F\u043E\u0437\u0438\u0446\u0438\u044F \u043F\u043E\u0437\u0438\u0446\u0456\u0457 \u043F\u043E\u0437\u043D\u0430\u0442 \u043F\u043E\u0437\u043D\u0430\u0442\u0430 \u043F\u043E\u0437\u043D\u0430\u0442\u0438 \u043F\u043E\u0437\u043D\u0430\u0442\u043E \u043F\u043E\u043A\u0430 \u043F\u043E\u043A\u0430\u0437\u0430\u043B\u0438 \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C \u043F\u043E\u043A\u0430\u0437\u043D\u0438\u043A \u043F\u043E\u043A\u0438 \u043F\u043E\u043A\u0438\u043D\u0443\u043B \u043F\u043E\u043A\u043E\u043B\u0435\u043D\u0438\u044F \u043F\u043E\u043A\u0440\u0430\u0458 \u043F\u043E\u043B \u043F\u043E\u043B\u0430 \u043F\u043E\u043B\u0435 \u043F\u043E\u043B\u0438\u0442\u0438\u043A \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0435 \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0438 \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0443 \u043F\u043E\u043B\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u043E\u043B\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u043E\u043B\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043F\u043E\u043B\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u043F\u043E\u043B\u0438\u0442\u0438\u0447\u043A\u0438 \u043F\u043E\u043B\u0438\u0446\u0438\u0438 \u043F\u043E\u043B\u043A \u043F\u043E\u043B\u043A\u0430 \u043F\u043E\u043B\u043A\u043E\u0432\u043D\u0438\u043A \u043F\u043E\u043B\u043A\u043E\u0432\u043D\u0438\u043A\u0430 \u043F\u043E\u043B\u043A\u0443 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0430 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0435 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0438 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u044B \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0456 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043F\u043E\u043B\u0443 \u043F\u043E\u043B\u0443\u0447\u0430\u0432\u0430 \u043F\u043E\u043B\u0443\u0447\u0430\u0435\u0442 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u043E\u043B\u0443\u0447\u0438\u0432 \u043F\u043E\u043B\u0443\u0447\u0438\u043B \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0430 \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u0443 \u043F\u043E\u043B\u044C\u0441\u043A \u043F\u043E\u043B\u044F \u043F\u043E\u043B\u0456 \u043F\u043E\u043B\u0456\u043F\u0435\u043F\u0442\u0438\u0434\u043D\u043E\u0433\u043E \u043F\u043E\u043B\u0456\u0442\u0438\u043A\u0438 \u043F\u043E\u043B\u0456\u0442\u0438\u0447\u043D\u0438\u0445 \u043F\u043E\u043C \u043F\u043E\u043C\u0435\u0440 \u043F\u043E\u043C\u0435\u0453\u0443 \u043F\u043E\u043C\u0438\u043C\u043E \u043F\u043E\u043C\u043E\u0448 \u043F\u043E\u043C\u043E\u0449\u0438 \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A \u043F\u043E\u043C\u043E\u0449\u044C \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u043F\u043E\u043C\u043E\u045B \u043F\u043E\u043D\u0430\u0434 \u043F\u043E\u043D\u043E\u0432\u043E \u043F\u043E\u043F \u043F\u043E\u043F\u0430\u043B \u043F\u043E\u043F\u0435\u0440\u0435\u0434\u043D\u0456\u0445 \u043F\u043E\u043F\u0438\u0441\u0430 \u043F\u043E\u043F\u0438\u0441\u0443 \u043F\u043E\u043F\u0440\u0430\u0432\u0435\u043D\u0438 \u043F\u043E\u043F\u044B\u0442\u043A\u0438 \u043F\u043E\u0440 \u043F\u043E\u0440\u0430\u0434\u0438 \u043F\u043E\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u043F\u043E\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u043F\u043E\u0440\u0430\u0437\u043A\u0438 \u043F\u043E\u0440\u0435\u0434 \u043F\u043E\u0440\u043E\u0434\u0438\u0446\u0435 \u043F\u043E\u0440\u0442 \u043F\u043E\u0440\u0442\u0440\u0435\u0442 \u043F\u043E\u0440\u044F\u0434\u043A\u0430 \u043F\u043E\u0440\u044F\u0434\u043A\u0435 \u043F\u043E\u0440\u044F\u0434\u043A\u0443 \u043F\u043E\u0440\u044F\u0434\u043E\u043A \u043F\u043E\u0441\u0430\u0434\u0443 \u043F\u043E\u0441\u0435\u0431\u043D\u043E \u043F\u043E\u0441\u0435\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u0441\u0435\u043B\u0435\u043D\u0438\u0439 \u043F\u043E\u0441\u0435\u043B\u0435\u043D\u0438\u044F \u043F\u043E\u0441\u0435\u043B\u0435\u043D\u043D\u044F \u043F\u043E\u0441\u0435\u0442 \u043F\u043E\u0441\u043A\u043E\u043B\u044C\u043A\u0443 \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0433\u043E \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0439 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0442\u0435 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0445 \u043F\u043E\u0441\u043C\u0435\u0440\u0442\u043D\u043E \u043F\u043E\u0441\u043E\u0431\u0438\u0435 \u043F\u043E\u0441\u0440\u0435\u0434\u0441\u0442\u0432\u043E\u043C \u043F\u043E\u0441\u0442 \u043F\u043E\u0441\u0442\u0430 \u043F\u043E\u0441\u0442\u0430\u043B\u0430 \u043F\u043E\u0441\u0442\u0430\u043E \u043F\u043E\u0441\u0442\u0430\u0458\u0435 \u043F\u043E\u0441\u0442\u0435\u043F\u0435\u043D\u043D\u043E \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u043E \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u043E\u0433\u043E \u043F\u043E\u0441\u0442\u043E\u0458\u0435 \u043F\u043E\u0441\u0442\u043E\u0458\u0438 \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u0430 \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u043E \u043F\u043E\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u043E\u0441\u0442\u0443 \u043F\u043E\u0441\u0442\u0443\u043F\u0438\u043B \u043F\u043E\u0441\u0442\u0456\u0439\u043D\u043E \u043F\u043E\u0441\u0451\u043B\u043A\u0430 \u043F\u043E\u0441\u0451\u043B\u043A\u0435 \u043F\u043E\u0441\u0451\u043B\u043E\u043A \u043F\u043E\u0442\u0435\u0440\u0438 \u043F\u043E\u0442\u043E\u0430 \u043F\u043E\u0442\u043E\u043C \u043F\u043E\u0442\u043E\u043C\u0443 \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u043E \u043F\u043E\u0442\u0443\u0436\u043D\u0456\u0441\u0442\u044E \u043F\u043E\u0442\u0456\u043C \u043F\u043E\u0445\u043E\u0434 \u043F\u043E\u0445\u043E\u0434\u0436\u0435\u043D\u043D\u044F \u043F\u043E\u0445\u043E\u0434\u0438\u0442\u044C \u043F\u043E\u0445\u043E\u0440\u043E\u043D\u0435\u043D \u043F\u043E\u0447\u0430\u0432 \u043F\u043E\u0447\u0430\u043B\u0430 \u043F\u043E\u0447\u0430\u043B\u0438 \u043F\u043E\u0447\u0430\u0442\u043A\u0443 \u043F\u043E\u0447\u0430\u0442\u043E\u043A \u043F\u043E\u0447\u0435\u043E \u043F\u043E\u0447\u0435\u0442\u043A\u043E\u043C \u043F\u043E\u0447\u0435\u0442\u043A\u0443 \u043F\u043E\u0447\u0435\u0442\u043E\u043A\u043E\u0442 \u043F\u043E\u0447\u0442\u0438 \u043F\u043E\u0448\u0438\u0440\u0435\u043D\u043D\u044F \u043F\u043E\u0448\u0442\u0430 \u043F\u043E\u044D\u0437\u0438\u0438 \u043F\u043E\u044D\u0442 \u043F\u043E\u044D\u0442\u0430 \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u043F\u043E\u044F\u0432\u0438\u043B\u0430\u0441\u044C \u043F\u043E\u044F\u0432\u0438\u043B\u0438\u0441\u044C \u043F\u043E\u044F\u0432\u0438\u043B\u0441\u044F \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043F\u043E\u044F\u0441\u0443 \u043F\u043E\u044F\u0441\u044B\u043D\u0434\u0430 \u043F\u0440\u0430 \u043F\u0440\u0430\u0432 \u043F\u0440\u0430\u0432\u0430 \u043F\u0440\u0430\u0432\u0430\u0445 \u043F\u0440\u0430\u0432\u0434\u0430 \u043F\u0440\u0430\u0432\u0438 \u043F\u0440\u0430\u0432\u0438\u043B \u043F\u0440\u0430\u0432\u0438\u043B\u0430 \u043F\u0440\u0430\u0432\u0438\u043B\u043E \u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u0430 \u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E \u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u0430\u0432\u043B\u0456\u043D\u043D\u044F \u043F\u0440\u0430\u0432\u043E \u043F\u0440\u0430\u0432\u043E\u043C \u043F\u0440\u0430\u0432\u043E\u043C\u0443 \u043F\u0440\u0430\u0432\u043E\u0441\u043B\u0430\u0432\u043D\u0430 \u043F\u0440\u0430\u0432\u043E\u0441\u043B\u0430\u0432\u043D\u043E\u0439 \u043F\u0440\u0430\u0437 \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0430 \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0438 \u043F\u0440\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u0440\u0430\u043A\u0442\u0438\u0447\u043D\u043E \u043F\u0440\u0430\u0446\u0430\u0432\u0430\u045E \u043F\u0440\u0430\u0446\u0435\u0437\u0434\u0430\u0442\u043D\u043E\u0433\u043E \u043F\u0440\u0430\u0446\u044B \u043F\u0440\u0430\u0446\u044C \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u0432 \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u043B\u0430 \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u043B\u0438 \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u043B\u043E \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u0442\u0438 \u043F\u0440\u0430\u0446\u044E\u0454 \u043F\u0440\u0430\u0446\u044F\u0433\u0443 \u043F\u0440\u0430\u0446\u0456 \u043F\u0440\u0432 \u043F\u0440\u0432\u0430 \u043F\u0440\u0432\u0430\u0442\u0430 \u043F\u0440\u0432\u0435 \u043F\u0440\u0432\u0435\u043D\u0441\u0442\u0432\u043E \u043F\u0440\u0432\u0435\u043D\u0441\u0442\u0432\u0443 \u043F\u0440\u0432\u0438 \u043F\u0440\u0432\u0438\u043E\u0442 \u043F\u0440\u0432\u043E \u043F\u0440\u0432\u043E\u0433 \u043F\u0440\u0435 \u043F\u0440\u0435\u0432\u043E\u0434 \u043F\u0440\u0435\u0434 \u043F\u0440\u0435\u0434\u0435\u043B\u0430\u0445 \u043F\u0440\u0435\u0434\u0438 \u043F\u0440\u0435\u0434\u0438\u043C\u043D\u043E \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u043B \u043F\u0440\u0435\u0434\u043C\u0435\u0442 \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u0438 \u043F\u0440\u0435\u0434\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043F\u0440\u0435\u0434\u043F\u0440\u0438\u044F\u0442\u0438\u0439 \u043F\u0440\u0435\u0434\u043F\u0440\u0438\u044F\u0442\u0438\u044F \u043F\u0440\u0435\u0434\u0441\u0435\u0434\u0430\u0442\u0435\u043B \u043F\u0440\u0435\u0434\u0441\u0435\u0434\u0430\u0442\u0435\u043B\u0435\u043C \u043F\u0440\u0435\u0434\u0441\u0435\u0434\u0430\u0442\u0435\u043B\u044C \u043F\u0440\u0435\u0434\u0441\u0435\u0434\u0430\u0442\u0435\u043B\u044F \u043F\u0440\u0435\u0434\u0441\u0435\u0434\u043D\u0438\u043A \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u0435\u0439 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u0438 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u0435\u043D \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0430 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u044B \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u044F\u0432\u0430 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u044F\u044E\u0442 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043D\u0438\u043A\u0456\u0432 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0459\u0430 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u043F\u0440\u0435\u0436\u0434\u0435 \u043F\u0440\u0435\u0437 \u043F\u0440\u0435\u0437\u0438\u0434\u0435\u043D\u0442 \u043F\u0440\u0435\u0437\u0438\u0434\u0435\u043D\u0442\u0430 \u043F\u0440\u0435\u0437\u0438\u0434\u0435\u043D\u0442\u043E\u043C \u043F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E \u043F\u0440\u0435\u043A\u043E \u043F\u0440\u0435\u043A\u0443 \u043F\u0440\u0435\u043C \u043F\u0440\u0435\u043C\u0430 \u043F\u0440\u0435\u043C\u0438\u0438 \u043F\u0440\u0435\u043C\u0438\u043D\u0430\u0432\u0430 \u043F\u0440\u0435\u043C\u0438\u044E \u043F\u0440\u0435\u043C\u0438\u044F \u043F\u0440\u0435\u043C\u044C\u0435\u0440 \u043F\u0440\u0435\u043C\u044C\u0435\u0440\u0430 \u043F\u0440\u0435\u043C\u0456\u0457 \u043F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u043B \u043F\u0440\u0435\u0441\u0442\u043E\u043B \u043F\u0440\u0435\u0442\u0441\u0442\u0430\u0432\u0443\u0432\u0430 \u043F\u0440\u0435\u0444\u0435\u043A\u0442\u0443\u0440\u0438 \u043F\u0440\u0438 \u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u043F\u0440\u0438\u0431\u044B\u043B \u043F\u0440\u0438\u0432\u0435\u043B\u043E \u043F\u0440\u0438\u0432\u0438\u0434\u043D\u0438 \u043F\u0440\u0438\u0432\u043E\u0434\u0438\u0442 \u043F\u0440\u0438\u0435\u043C\u0430 \u043F\u0440\u0438\u0437 \u043F\u0440\u0438\u0437\u0432\u0430\u043D \u043F\u0440\u0438\u0437\u0435\u0440 \u043F\u0440\u0438\u0437\u043D\u0430\u043D \u043F\u0440\u0438\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439 \u043F\u0440\u0438\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u043F\u0440\u0438\u0437\u0451\u0440 \u043F\u0440\u0438\u043A\u0430\u0437 \u043F\u0440\u0438\u043B\u0438\u043A\u043E\u043C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u0440\u0438\u043C\u0435\u0440 \u043F\u0440\u0438\u043C\u0435\u0440\u043D\u043E \u043F\u0440\u0438\u043C\u0456\u0449\u0435\u043D\u043D\u044F \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0435\u0442 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u043B \u043F\u0440\u0438\u043D\u0446 \u043F\u0440\u0438\u043D\u0446\u0430 \u043F\u0440\u0438\u043D\u0446\u0438\u043F \u043F\u0440\u0438\u043D\u044F\u043B \u043F\u0440\u0438\u043D\u044F\u043B\u0430 \u043F\u0440\u0438\u043D\u044F\u043B\u0438 \u043F\u0440\u0438\u043D\u044F\u0442 \u043F\u0440\u0438\u043D\u044F\u0442\u043E \u043F\u0440\u0438\u043D\u044F\u0442\u044C \u043F\u0440\u0438\u043F\u0430\u0434\u0430 \u043F\u0440\u0438\u043F\u0430\u0453\u0430 \u043F\u0440\u0438\u0440\u043E\u0434\u0435 \u043F\u0440\u0438\u0440\u043E\u0434\u0438 \u043F\u0440\u0438\u0440\u043E\u0434\u043D\u043E \u043F\u0440\u0438\u0440\u043E\u0434\u044B \u043F\u0440\u0438\u0441\u0432\u043E\u0435\u043D\u043E \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u043B\u0441\u044F \u043F\u0440\u0438\u0442\u043E\u043A \u043F\u0440\u0438\u0442\u043E\u043A\u0430 \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u043B\u043E\u0441\u044C \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u043F\u0440\u0438\u0447\u0438\u043D \u043F\u0440\u0438\u0447\u0438\u043D\u0430 \u043F\u0440\u0438\u0447\u0438\u043D\u0430\u043C \u043F\u0440\u0438\u0447\u0438\u043D\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0438 \u043F\u0440\u0438\u0447\u0438\u043D\u043E\u0439 \u043F\u0440\u0438\u0447\u0451\u043C \u043F\u0440\u0438\u0448\u043B\u043E\u0441\u044C \u043F\u0440\u0438\u0454\u0434\u043D\u0430\u0432\u0441\u044F \u043F\u0440\u043E \u043F\u0440\u043E\u0431\u043B\u0435\u043C \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0438 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u043F\u0440\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u043F\u0440\u043E\u0432\u0435\u0436\u0434\u0430 \u043F\u0440\u043E\u0432\u0435\u043B\u0430 \u043F\u0440\u043E\u0432\u0435\u043B\u0438 \u043F\u0440\u043E\u0432\u0435\u0441\u0442\u0438 \u043F\u0440\u043E\u0432\u0438\u043D\u0446\u0438\u0438 \u043F\u0440\u043E\u0432\u0438\u043D\u0446\u0438\u044F \u043F\u0440\u043E\u0432\u0438\u043D\u0446\u0438\u044F\u0441\u044B\u043D\u0434\u0430 \u043F\u0440\u043E\u0432\u0438\u043D\u0446\u0438\u044F\u0441\u044B\u043D\u044B\u04A3 \u043F\u0440\u043E\u0432\u043E\u0434\u0438\u043B\u0438\u0441\u044C \u043F\u0440\u043E\u0432\u043E\u0434\u0438\u0442\u044C \u043F\u0440\u043E\u0432\u0451\u043B \u043F\u0440\u043E\u0432\u0456\u0432 \u043F\u0440\u043E\u0432\u0456\u043D\u0446\u0456\u0457 \u043F\u0440\u043E\u0433\u0440\u0430\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0430 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0438 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u043B \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u043B \u043F\u0440\u043E\u0434\u0443\u043A\u0442 \u043F\u0440\u043E\u0434\u0443\u043A\u0446\u0438\u0438 \u043F\u0440\u043E\u0434\u0443\u043A\u0446\u0456\u0457 \u043F\u0440\u043E\u0434\u044A\u043B\u0436\u0430\u0432\u0430 \u043F\u0440\u043E\u0434\u044E\u0441\u0435\u0440 \u043F\u0440\u043E\u0435\u043A\u0442 \u043F\u0440\u043E\u0435\u043A\u0442\u0430 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u043C \u043F\u0440\u043E\u0435\u043A\u0442\u0443 \u043F\u0440\u043E\u0436\u0438\u0432\u0430\u043B\u0438 \u043F\u0440\u043E\u0436\u0438\u0432\u0430\u043B\u043E \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0439 \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0451\u043D \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u0430 \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u043E \u043F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u043E \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442 \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u043B\u0435\u0442\u043D\u0430\u0442\u0430 \u043F\u0440\u043E\u043C\u0435\u043D\u0438 \u043F\u0440\u043E\u043C\u0438\u0441\u043B\u043E\u0432\u043E\u0441\u0442\u0456 \u043F\u0440\u043E\u043C\u044B\u0448\u043B\u0435\u043D\u043D\u043E\u0441\u0442\u0438 \u043F\u0440\u043E\u0441\u0442\u0438\u0440\u0435 \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u0440\u043E\u0441\u0442\u043E\u0440 \u043F\u0440\u043E\u0441\u0442\u043E\u0440\u0443 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E \u043F\u0440\u043E\u0442\u0435 \u043F\u0440\u043E\u0442\u0435\u043A\u0430\u0435\u0442 \u043F\u0440\u043E\u0442\u0438 \u043F\u0440\u043E\u0442\u0438\u0432 \u043F\u0440\u043E\u0442\u0438\u0432\u043D\u0438\u043A\u0430 \u043F\u0440\u043E\u0442\u044F\u0433\u043E\u043C \u043F\u0440\u043E\u0442\u044F\u0436\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0444 \u043F\u0440\u043E\u0444\u0435\u0441\u043E\u0440 \u043F\u0440\u043E\u0444\u0435\u0441\u043E\u0440\u0430 \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u043E\u0440 \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u043E\u0440\u0430 \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u043E\u0440\u043E\u043C \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u043B \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u043B\u0438 \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442 \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442\u044C \u043F\u0440\u043E\u0445\u043E\u0434\u044F\u0442 \u043F\u0440\u043E\u0446\u0435\u043D\u0438 \u043F\u0440\u043E\u0446\u0435\u0441 \u043F\u0440\u043E\u0446\u0435\u0441\u0438 \u043F\u0440\u043E\u0446\u0435\u0441\u0441 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0435 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0432 \u043F\u0440\u043E\u0446\u0435\u0441\u0443 \u043F\u0440\u043E\u0446\u0435\u0441\u0456 \u043F\u0440\u043E\u0446\u0458\u0435\u043D\u0438 \u043F\u0440\u043E\u0448\u043B\u0430 \u043F\u0440\u043E\u0448\u043B\u0438 \u043F\u0440\u043E\u0448\u043B\u043E\u043C \u043F\u0440\u043E\u0448\u0451\u043B \u043F\u0440\u044B \u043F\u0440\u044B\u0441\u0432\u0435\u0447\u0430\u043D\u044B\u0445 \u043F\u0440\u044F\u043C\u043E \u043F\u0440\u044F\u043C\u043E\u0439 \u043F\u0442\u0438\u0446 \u043F\u0442\u0438\u0446\u0430 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438 \u043F\u0443\u0431\u043B\u0456\u043A\u0430\u0446\u044B\u0439 \u043F\u0443\u043B\u043D\u0103 \u043F\u0443\u043D\u043A\u0442 \u043F\u0443\u043D\u043A\u0442\u0430 \u043F\u0443\u043D\u043A\u0442\u0430\u043C \u043F\u0443\u043D\u043A\u0442\u0430\u045E \u043F\u0443\u043D\u043A\u0442\u0438 \u043F\u0443\u043D\u043A\u0442\u043E\u0432 \u043F\u0443\u043D\u043A\u0442\u044B \u043F\u0443\u0442 \u043F\u0443\u0442\u0430 \u043F\u0443\u0442\u0438 \u043F\u0443\u0442\u044C \u043F\u0443\u0442\u0451\u043C \u043F\u044A\u0440\u0432\u0430\u0442\u0430 \u043F\u044A\u0440\u0432\u0435\u043D\u0441\u0442\u0432\u043E \u043F\u044A\u0440\u0432\u0438 \u043F\u044A\u0440\u0432\u0438\u0442\u0435 \u043F\u044A\u0440\u0432\u0438\u044F \u043F\u044A\u0440\u0432\u0438\u044F\u0442 \u043F\u044A\u0442 \u043F\u044A\u0442\u0438 \u043F\u044B\u0442\u0430\u0435\u0442\u0441\u044F \u043F\u044B\u0442\u0430\u043B\u0441\u044F \u043F\u044F\u0442\u0438 \u043F\u044F\u0442\u044C \u043F\u0456\u0432\u0434\u0435\u043D\u043D\u0438\u0439 \u043F\u0456\u0432\u0434\u0435\u043D\u043D\u043E \u043F\u0456\u0432\u0434\u0435\u043D\u044C \u043F\u0456\u0432\u0434\u043D\u0456 \u043F\u0456\u0432\u043D\u043E\u0447\u0456 \u043F\u0456\u0432\u043D\u0456\u0447 \u043F\u0456\u0432\u043D\u0456\u0447\u043D\u0438\u0439 \u043F\u0456\u0432\u043D\u0456\u0447\u043D\u043E \u043F\u0456\u0434 \u043F\u0456\u0434\u0432\u0438\u0449\u0435\u043D\u043D\u044F \u043F\u0456\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0438 \u043F\u0456\u0434\u043F\u043E\u0440\u044F\u0434\u043A\u043E\u0432\u0430\u043D\u0456 \u043F\u0456\u0434\u043F\u0440\u0438\u0454\u043C\u0441\u0442\u0432\u0430 \u043F\u0456\u0434\u0442\u0440\u0438\u043C\u043A\u0438 \u043F\u0456\u0434\u0442\u0440\u0438\u043C\u043A\u0443 \u043F\u0456\u0437\u043D\u0456\u0448\u0435 \u043F\u0456\u0441\u0435\u043D\u044C \u043F\u0456\u0441\u043B\u044F \u043F\u0456\u0441\u043D\u0456 \u0440\u0430\u0431\u043E\u0442 \u0440\u0430\u0431\u043E\u0442\u0430 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u043B \u0440\u0430\u0431\u043E\u0442\u0430\u043B\u0430 \u0440\u0430\u0431\u043E\u0442\u0430\u043B\u0438 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u0430 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u0435 \u0440\u0430\u0431\u043E\u0442\u0438 \u0440\u0430\u0431\u043E\u0442\u043D\u0438\u043A \u0440\u0430\u0431\u043E\u0442\u043E\u0439 \u0440\u0430\u0431\u043E\u0442\u0443 \u0440\u0430\u0431\u043E\u0442\u044B \u0440\u0430\u0431\u043E\u0447\u0438\u0439 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u0440\u0430\u0432\u043D\u043E \u0440\u0430\u0434 \u0440\u0430\u0434\u0430 \u0440\u0430\u0434\u0438 \u0440\u0430\u0434\u0438\u0430\u0446\u0438\u043D \u0440\u0430\u0434\u0438\u043E \u0440\u0430\u0434\u044F\u043D\u0441\u044C\u043A\u0438\u0439 \u0440\u0430\u0434\u044F\u043D\u0441\u044C\u043A\u043E\u0457 \u0440\u0430\u0434\u0456 \u0440\u0430\u0437 \u0440\u0430\u0437\u0430 \u0440\u0430\u0437\u0430\u043C \u0440\u0430\u0437\u0432\u0438\u0442\u0438\u0435 \u0440\u0430\u0437\u0432\u0438\u0442\u0438\u0438 \u0440\u0430\u0437\u0432\u0438\u0442\u0438\u044E \u0440\u0430\u0437\u0432\u0438\u0442\u0438\u044F \u0440\u0430\u0437\u0432\u043E\u0458 \u0440\u0430\u0437\u043B\u0438\u043A\u0430 \u0440\u0430\u0437\u043B\u0438\u0447\u043D \u0440\u0430\u0437\u043B\u0438\u0447\u043D\u0438 \u0440\u0430\u0437\u043B\u0438\u0447\u043D\u044B\u0435 \u0440\u0430\u0437\u043B\u0438\u0447\u043D\u044B\u0445 \u0440\u0430\u0437\u043C\u0435\u0440 \u0440\u0430\u0437\u043C\u0435\u0448\u0447\u0430\u043D\u044B \u0440\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u0440\u0430\u0437\u043D\u044B\u0435 \u0440\u0430\u0437\u043D\u044B\u0445 \u0440\u0430\u0437\u043E\u043C \u0440\u0430\u0437\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0440\u0430\u0437\u0443 \u0440\u0430\u0437\u0456 \u0440\u0430\u0437\u0456\u0432 \u0440\u0430\u0439\u043E\u043D \u0440\u0430\u0439\u043E\u043D\u0115\u0441\u0435\u043D \u0440\u0430\u0439\u043E\u043D\u0430 \u0440\u0430\u0439\u043E\u043D\u0430\u043C \u0440\u0430\u0439\u043E\u043D\u0430\u0445 \u0440\u0430\u0439\u043E\u043D\u0434\u043E\u0448\u0442\u0443\u0440\u0443\u0443 \u0440\u0430\u0439\u043E\u043D\u0435 \u0440\u0430\u0439\u043E\u043D\u0438 \u0440\u0430\u0439\u043E\u043D\u043B\u0430\u0443 \u0440\u0430\u0439\u043E\u043D\u043D\u043E\u0433\u043E \u0440\u0430\u0439\u043E\u043D\u043E\u0432 \u0440\u0430\u0439\u043E\u043D\u0443 \u0440\u0430\u0439\u043E\u043D\u0443\u043D\u0430 \u0440\u0430\u0439\u043E\u043D\u0443\u043D\u0434\u0430\u0433\u044B \u0440\u0430\u0439\u043E\u043D\u044B \u0440\u0430\u0439\u043E\u043D\u044B\u043D\u0434\u0430 \u0440\u0430\u0439\u043E\u043D\u044B\u043D\u0434\u0430\u0493\u044B \u0440\u0430\u0439\u043E\u043D\u0456 \u0440\u0430\u043A\u0430 \u0440\u0430\u043A\u0435\u0442 \u0440\u0430\u043A\u0435\u0442\u0430 \u0440\u0430\u043A\u0456 \u0440\u0430\u043C\u043A\u0430\u0445 \u0440\u0430\u043C\u043A\u0438\u0442\u0435 \u0440\u0430\u043D\u0433 \u0440\u0430\u043D\u0433\u0430 \u0440\u0430\u043D\u0435\u0435 \u0440\u0430\u043D\u0435\u043D \u0440\u0430\u043D\u043E \u0440\u0430\u043D\u044C\u0448\u0435 \u0440\u0430\u043D\u0456\u0448\u0435 \u0440\u0430\u0441\u043C\u0438\u0439 \u0440\u0430\u0441\u043F\u0430\u0434\u0430 \u0440\u0430\u0441\u043F\u043E\u043B\u0430\u0433\u0430\u0435\u0442\u0441\u044F \u0440\u0430\u0441\u043F\u043E\u043B\u043E\u0436\u0435\u043D \u0440\u0430\u0441\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0430 \u0440\u0430\u0441\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0439 \u0440\u0430\u0441\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u043E \u0440\u0430\u0441\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u044B \u0440\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u0441\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0438 \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u0439 \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u044F \u0440\u0430\u0442 \u0440\u0430\u0442\u0430 \u0440\u0430\u0442\u0443 \u0440\u0430\u0443\u043D\u0434\u0435 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0440\u0430\u0451\u043D \u0440\u0430\u0451\u043D\u0430 \u0440\u0430\u0451\u043D\u0435 \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u0440\u0435\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438 \u0440\u0435\u0432\u043E\u043B\u044E\u0446\u0438\u0438 \u0440\u0435\u0432\u043E\u043B\u044E\u0446\u0438\u043E\u043D\u0435\u0440 \u0440\u0435\u0432\u043E\u043B\u044E\u0446\u0438\u044F \u0440\u0435\u0432\u043E\u043B\u044E\u0446\u0456\u0457 \u0440\u0435\u0433\u0438\u043E\u043D \u0440\u0435\u0433\u0438\u043E\u043D\u0430 \u0440\u0435\u0433\u0438\u043E\u043D\u0430\u043B\u043D\u0443 \u0440\u0435\u0433\u0438\u043E\u043D\u0430\u0448\u043A\u0430 \u0440\u0435\u0433\u0438\u043E\u043D\u0435 \u0440\u0435\u0433\u0438\u043E\u043D\u0443 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u044B \u0440\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u043E \u0440\u0435\u0433\u0456\u043E\u043D\u0443 \u0440\u0435\u0433\u0456\u043E\u043D\u0456 \u0440\u0435\u0434 \u0440\u0435\u0434\u0430 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u043E\u043C \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0443 \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u0435\u0439 \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u0438 \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u044F\u0441\u044B \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u044F\u0441\u044B\u043D \u0440\u0435\u0434\u0430\u043A\u0446\u0456\u0457 \u0440\u0435\u0434\u0438\u0446\u0430 \u0440\u0435\u0434\u043A\u043E \u0440\u0435\u0435\u0441\u0442\u0440 \u0440\u0435\u0435\u0441\u0442\u0440\u0115 \u0440\u0435\u0435\u0441\u0442\u0440\u0115\u043D \u0440\u0435\u0435\u0441\u0442\u0440\u0115\u043D\u0447\u0438 \u0440\u0435\u0435\u0441\u0442\u0440\u0430 \u0440\u0435\u0435\u0441\u0442\u0440\u0435 \u0440\u0435\u0435\u0441\u0442\u0440\u0438 \u0440\u0435\u0435\u0441\u0442\u0440\u0438\u043D\u0438\u043D \u0440\u0435\u0435\u0441\u0442\u0440\u044B \u0440\u0435\u0435\u0441\u0442\u0440\u044B\u043D\u0434\u0430 \u0440\u0435\u0435\u0441\u0442\u0440\u0456 \u0440\u0435\u0435\u0441\u0442\u0440\u0456\u043D\u0434\u0435\u0433\u0456 \u0440\u0435\u0436 \u0440\u0435\u0436\u0438\u043C \u0440\u0435\u0436\u0438\u043C\u0430 \u0440\u0435\u0436\u0438\u0441\u0435\u0440 \u0440\u0435\u0436\u0438\u0441\u0435\u0440\u0430 \u0440\u0435\u0436\u0438\u0441\u0441\u0451\u0440 \u0440\u0435\u0436\u0438\u0441\u0441\u0451\u0440\u0430 \u0440\u0435\u0437\u043A\u043E \u0440\u0435\u0437\u0443\u043B\u0442\u0430\u0442 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430\u043C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430\u043C\u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0435 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u043C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0456 \u0440\u0435\u0439\u0442\u0438\u043D\u0433 \u0440\u0435\u043A \u0440\u0435\u043A\u0430 \u0440\u0435\u043A\u0430\u0442\u0430 \u0440\u0435\u043A\u0435 \u0440\u0435\u043A\u0438 \u0440\u0435\u043A\u043E\u0440\u0434 \u0440\u0435\u043A\u0442\u0430\u0441\u0446\u0435\u043D\u0437\u0438\u0458\u0430 \u0440\u0435\u043A\u0443 \u0440\u0435\u043B\u0438\u0433\u0438\u0438 \u0440\u0435\u043C\u043E\u043D\u0442 \u0440\u0435\u043F\u0443\u0431\u043B\u0438\u043A\u0430 \u0440\u0435\u0441\u043C\u0438 \u0440\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0430 \u0440\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0438 \u0440\u0435\u0441\u0443\u0440\u0441\u0115\u0441\u0435\u043C\u043F\u0435 \u0440\u0435\u0441\u0443\u0440\u0441\u0115\u0441\u0435\u043D \u0440\u0435\u0441\u0443\u0440\u0441\u043B\u0430\u0440\u044B \u0440\u0435\u0441\u0443\u0440\u0441\u043B\u0430\u0440\u044B\u043D\u044B\u04A3 \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432 \u0440\u0435\u0441\u0443\u0440\u0441\u0442\u0430\u0440 \u0440\u0435\u0441\u0443\u0440\u0441\u0442\u0430\u0440\u044B \u0440\u0435\u0441\u0443\u0440\u0441\u0442\u0430\u0440\u044B\u043D\u044B\u04A3 \u0440\u0435\u0442 \u0440\u0435\u0442\u0456\u043D\u0434\u0435 \u0440\u0435\u0444\u043E\u0440\u043C\u0438 \u0440\u0435\u0444\u043E\u0440\u043C\u044B \u0440\u0435\u0447\u0438 \u0440\u0435\u0447\u043D\u043E\u0439 \u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u0435\u043C \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0440\u0435\u0448\u0438\u043B \u0440\u0438\u043D\u043A\u0443 \u0440\u043E\u0431\u043E\u0442\u0430 \u0440\u043E\u0431\u043E\u0442\u0438 \u0440\u043E\u0431\u043E\u0442\u0443 \u0440\u043E\u0431\u043E\u0442\u0456 \u0440\u043E\u0431\u0456\u0442 \u0440\u043E\u0434 \u0440\u043E\u0434\u0430 \u0440\u043E\u0434\u0435\u043D \u0440\u043E\u0434\u0438\u043B\u0430\u0441\u044C \u0440\u043E\u0434\u0438\u043B\u0441\u044F \u0440\u043E\u0434\u0438\u043D\u0438 \u0440\u043E\u0434\u0438\u043D\u0456 \u0440\u043E\u0434\u0438\u0442\u0435\u043B\u0438 \u0440\u043E\u0434\u043E\u0432 \u0440\u043E\u0434\u043E\u043C \u0440\u043E\u0434\u0443 \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0440\u043E\u0437\u0432\u0438\u0442\u043A\u0443 \u0440\u043E\u0437\u0432\u0438\u0442\u043E\u043A \u0440\u043E\u0437\u043D\u044B\u0445 \u0440\u043E\u0437\u043F\u043E\u0447\u0430\u0432 \u0440\u043E\u0437\u0442\u0430\u0448\u043E\u0432\u0430\u043D\u0430 \u0440\u043E\u0437\u0442\u0430\u0448\u043E\u0432\u0430\u043D\u0435 \u0440\u043E\u0437\u0442\u0430\u0448\u043E\u0432\u0430\u043D\u0438\u0439 \u0440\u043E\u0437\u0442\u0430\u0448\u043E\u0432\u0430\u043D\u0438\u043C \u0440\u043E\u0437\u0442\u0430\u0448\u043E\u0432\u0430\u043D\u0456 \u0440\u043E\u043A \u0440\u043E\u043A\u0430\u043C\u0438 \u0440\u043E\u043A\u0430\u0445 \u0440\u043E\u043A\u0438 \u0440\u043E\u043A\u0443 \u0440\u043E\u043A\u0456\u0432 \u0440\u043E\u043B\u0438 \u0440\u043E\u043B\u044C \u0440\u043E\u043B\u044F \u0440\u043E\u043B\u044F\u0442\u0430 \u0440\u043E\u043B\u0456 \u0440\u043E\u043C\u0430\u043D \u0440\u043E\u043C\u0430\u043D\u0430 \u0440\u043E\u043C\u0430\u043D\u0443 \u0440\u043E\u0441 \u0440\u043E\u0441\u043B\u0438\u043D \u0440\u043E\u0441\u0441\u0438\u0439\u0441\u043A\u0430\u044F \u0440\u043E\u0441\u0441\u0438\u0439\u0441\u043A\u0438\u0439 \u0440\u043E\u0441\u0441\u0438\u0439\u0441\u043A\u0438\u0445 \u0440\u043E\u0441\u0441\u0438\u0439\u0441\u043A\u043E\u0433\u043E \u0440\u043E\u0441\u0441\u0438\u0439\u0441\u043A\u043E\u0439 \u0440\u043E\u0441\u0442 \u0440\u043E\u0441\u0442\u0430 \u0440\u043E\u0441\u0456\u0439\u0441\u044C\u043A\u0438\u0439 \u0440\u043E\u0441\u0456\u0439\u0441\u044C\u043A\u043E\u0457 \u0440\u043E\u0442\u0430 \u0440\u043E\u0442\u044B \u0440\u043E\u0446\u0456 \u0440\u043E\u0452\u0435\u043D \u0440\u0443\u0431\u043B\u0435\u0439 \u0440\u0443\u043A \u0440\u0443\u043A\u0430\u0445 \u0440\u0443\u043A\u0438 \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u043B \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u0435\u043C \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u0430 \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E\u043C \u0440\u0443\u043A\u0443 \u0440\u0443\u043C \u0440\u0443\u0441 \u0440\u0443\u0441\u043A \u0440\u0443\u0441\u043A\u0438 \u0440\u0443\u0441\u043B\u0430\u0440 \u0440\u0443\u0441\u0441\u043A\u0438\u0435 \u0440\u0443\u0441\u0441\u043A\u0438\u0439 \u0440\u0443\u0441\u0441\u043A\u0438\u0445 \u0440\u0443\u0441\u0441\u043A\u043E\u0433\u043E \u0440\u0443\u0441\u0441\u043A\u043E\u0439 \u0440\u0443\u0441\u0441\u043A\u043E\u043C \u0440\u0443\u0441\u04E3 \u0440\u0443\u0445 \u0440\u0443\u0445\u0443 \u0440\u044D\u0434 \u0440\u044D\u0434\u0430\u043A\u0446\u044B\u0456 \u0440\u044F\u0434 \u0440\u044F\u0434\u0430 \u0440\u044F\u0434\u0435 \u0440\u044F\u0434\u043E\u043C \u0440\u044F\u0434\u0443 \u0440\u0456\u0432\u0435\u043D\u044C \u0440\u0456\u0432\u043D\u0435\u043C \u0440\u0456\u0432\u043D\u044F \u0440\u0456\u0432\u043D\u0456 \u0440\u0456\u0437\u043D\u0438\u0445 \u0440\u0456\u0437\u043D\u0456 \u0440\u0456\u043A \u0440\u0456\u0447\u043A\u0430 \u0440\u0456\u0447\u043A\u0438 \u0440\u0456\u0447\u043D\u0430 \u0440\u0456\u0447\u0446\u0456 \u0440\u0456\u0448\u0435\u043D\u043D\u044F \u0440\u0456\u0448\u0435\u043D\u043D\u044F\u043C \u0441\u0430\u0432\u0435\u0437\u043D\u043E\u0458 \u0441\u0430\u0434 \u0441\u0430\u0434\u0430 \u0441\u0430\u0439\u0442 \u0441\u0430\u0439\u0442\u0430 \u0441\u0430\u0439\u0442\u0435 \u0441\u0430\u0439\u0442\u0440\u0430 \u0441\u0430\u0439\u0442\u044B \u0441\u0430\u0439\u0442\u044B\u043D\u0434\u0430 \u0441\u0430\u0439\u0442\u044B\u043D\u0434\u0430\u0493\u044B \u0441\u0430\u0439\u0442\u0456 \u0441\u0430\u0439\u0446\u0435 \u0441\u0430\u043A\u0430\u0432\u0456\u043A\u0430 \u0441\u0430\u043B\u0430\u043B\u044B\u049B \u0441\u0430\u043B\u0430\u0441\u044B \u0441\u0430\u043B\u043A\u044B\u043D \u0441\u0430\u043C \u0441\u0430\u043C\u0430 \u0441\u0430\u043C\u0435 \u0441\u0430\u043C\u0438 \u0441\u0430\u043C\u0438\u043C \u0441\u0430\u043C\u043E \u0441\u0430\u043C\u043E\u0432\u0440\u044F\u0434\u0443\u0432\u0430\u043D\u043D\u044F \u0441\u0430\u043C\u043E\u0433\u043E \u0441\u0430\u043C\u043E\u0435 \u0441\u0430\u043C\u043E\u0439 \u0441\u0430\u043C\u043E\u043B\u0451\u0442 \u0441\u0430\u043C\u043E\u043B\u0451\u0442\u0430 \u0441\u0430\u043C\u043E\u043B\u0451\u0442\u043E\u0432 \u0441\u0430\u043C\u043E\u043C \u0441\u0430\u043C\u043E\u043C\u0443 \u0441\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E \u0441\u0430\u043C\u044B\u0435 \u0441\u0430\u043C\u044B\u0439 \u0441\u0430\u043C\u044B\u043C \u0441\u0430\u043C\u044B\u0445 \u0441\u0430\u043D \u0441\u0430\u043D\u043D\u0430 \u0441\u0430\u043D\u044B \u0441\u0430\u0440\u044B\u043D \u0441\u0430\u0441\u0442\u0430\u0432\u0443 \u0441\u0430\u0442\u0435\u043B\u0438\u0442\u043E\u0442 \u0441\u0430\u0442\u04B3\u0438 \u0441\u0430\u0445\u044C\u0442 \u0441\u0430\u0445\u044C\u0442\u0438\u0439\u043D \u0441\u0430\u044F\u0441\u0438 \u0441\u0430\u0493\u0430\u0441\u044B \u0441\u0431\u043E\u0440\u043D\u0430\u044F \u0441\u0431\u043E\u0440\u043D\u0438\u043A \u0441\u0431\u043E\u0440\u043D\u043E\u0439 \u0441\u0431\u043E\u0440\u043D\u0443\u044E \u0441\u0432\u0430\u0439\u0433\u043E \u0441\u0432\u0430\u044E \u0441\u0432\u0430\u0451\u0439 \u0441\u0432\u0435 \u0441\u0432\u0435\u0433\u0430 \u0441\u0432\u0435\u0434\u0435\u043D\u0438\u044F \u0441\u0432\u0435\u0442 \u0441\u0432\u0435\u0442\u0430 \u0441\u0432\u0435\u0442\u043E\u0432\u043D\u0430 \u0441\u0432\u0435\u0442\u043E\u0442 \u0441\u0432\u0435\u0442\u0441\u043A\u0430 \u0441\u0432\u0435\u0442\u0441\u043A\u043E\u0433 \u0441\u0432\u0435\u0442\u0443 \u0441\u0432\u0438 \u0441\u0432\u0438\u043C \u0441\u0432\u0438\u0445 \u0441\u0432\u043E\u0431\u043E\u0434\u0443 \u0441\u0432\u043E\u0431\u043E\u0434\u044B \u0441\u0432\u043E\u0433 \u0441\u0432\u043E\u0433\u043E \u0441\u0432\u043E\u0435\u0433\u043E \u0441\u0432\u043E\u0435\u0439 \u0441\u0432\u043E\u0435\u043C \u0441\u0432\u043E\u0435\u043C\u0443 \u0441\u0432\u043E\u0435\u0442\u043E \u0441\u0432\u043E\u0438 \u0441\u0432\u043E\u0438\u043C \u0441\u0432\u043E\u0438\u043C\u0438 \u0441\u0432\u043E\u0438\u0442\u0435 \u0441\u0432\u043E\u0438\u0445 \u0441\u0432\u043E\u0439 \u0441\u0432\u043E\u0439\u0441\u0442\u0432\u0430 \u0441\u0432\u043E\u043C \u0441\u0432\u043E\u044E \u0441\u0432\u043E\u044F \u0441\u0432\u043E\u044F\u0442\u0430 \u0441\u0432\u043E\u0451 \u0441\u0432\u043E\u0451\u043C \u0441\u0432\u043E\u0454 \u0441\u0432\u043E\u0454\u043C\u0443 \u0441\u0432\u043E\u0454\u044E \u0441\u0432\u043E\u0454\u0457 \u0441\u0432\u043E\u0457 \u0441\u0432\u043E\u0457\u0439 \u0441\u0432\u043E\u0457\u043C \u0441\u0432\u043E\u0457\u043C\u0438 \u0441\u0432\u043E\u0457\u0445 \u0441\u0432\u043E\u0458 \u0441\u0432\u043E\u0458\u0430\u0442\u0430 \u0441\u0432\u043E\u0458\u0435 \u0441\u0432\u043E\u0458\u0438\u043C \u0441\u0432\u043E\u0458\u0438\u0445 \u0441\u0432\u043E\u0458\u043E\u0442 \u0441\u0432\u043E\u0458\u043E\u0458 \u0441\u0432\u043E\u0458\u0443 \u0441\u0432\u044A\u0440\u0437\u0430\u043D\u0438 \u0441\u0432\u044B\u0448\u0435 \u0441\u0432\u044F\u0437\u0430\u043D\u043E \u0441\u0432\u044F\u0437\u0438 \u0441\u0432\u044F\u0437\u044C \u0441\u0432\u044F\u0442 \u0441\u0432\u044F\u0442\u043E\u0433\u043E \u0441\u0432\u044F\u0442\u043E\u0439 \u0441\u0432\u0456\u0439 \u0441\u0432\u0456\u0442 \u0441\u0432\u0456\u0442\u043E\u0432\u043E\u0457 \u0441\u0432\u0456\u0442\u0443 \u0441\u0432\u0456\u0442\u0456 \u0441\u0434\u0435\u043B\u0430\u043B \u0441\u0434\u0435\u043B\u0430\u0442\u044C \u0441\u0435\u0431\u0435 \u0441\u0435\u0431\u044F \u0441\u0435\u0432\u0435\u0440 \u0441\u0435\u0432\u0435\u0440\u0435 \u0441\u0435\u0432\u0435\u0440\u043D\u043E \u0441\u0435\u0432\u0435\u0440\u043D\u043E\u0439 \u0441\u0435\u0432\u0435\u0440\u043E \u0441\u0435\u0432\u0435\u0440\u0443 \u0441\u0435\u0433\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F \u0441\u0435\u0434\u0438\u0448\u0442\u0435 \u0441\u0435\u0437\u043E\u043D \u0441\u0435\u0437\u043E\u043D\u0430 \u0441\u0435\u0437\u043E\u043D\u0430\u0442\u0430 \u0441\u0435\u0437\u043E\u043D\u0435 \u0441\u0435\u0437\u043E\u043D\u0438 \u0441\u0435\u0437\u043E\u043D\u0443 \u0441\u0435\u0437\u043E\u043D\u0456 \u0441\u0435\u0439\u0447\u0430\u0441 \u0441\u0435\u043A\u0440\u0435\u0442\u0430\u0440 \u0441\u0435\u043A\u0440\u0435\u0442\u0430\u0440\u044C \u0441\u0435\u043A\u0440\u0435\u0442\u0430\u0440\u044F \u0441\u0435\u043A\u0442\u043E\u0440 \u0441\u0435\u043A\u0443\u043D\u0434 \u0441\u0435\u043B\u0430 \u0441\u0435\u043B\u0435 \u0441\u0435\u043B\u0438\u0449\u0430 \u0441\u0435\u043B\u0438\u0449\u0435 \u0441\u0435\u043B\u043E \u0441\u0435\u043B\u043E\u0442\u043E \u0441\u0435\u043B\u0443 \u0441\u0435\u043B\u044C\u0441\u0430\u0432\u0435\u0442\u0430 \u0441\u0435\u043B\u044C\u0441\u043A\u0438\u0439 \u0441\u0435\u043B\u044C\u0441\u043A\u0438\u0445 \u0441\u0435\u043B\u044C\u0441\u043A\u043E\u0433\u043E \u0441\u0435\u043B\u044C\u0441\u043A\u043E\u0435 \u0441\u0435\u043B\u044C\u0441\u043E\u0432\u0435\u0442 \u0441\u0435\u043B\u044C\u0441\u043E\u0432\u0435\u0442\u0430 \u0441\u0435\u043B\u044F\u043D \u0441\u0435\u043B\u0456 \u0441\u0435\u043C\u0435\u0439 \u0441\u0435\u043C\u0435\u0439\u0441\u0442\u0432\u0430 \u0441\u0435\u043C\u0435\u0439\u0441\u0442\u0432\u043E \u0441\u0435\u043C\u0435\u0439\u0441\u0442\u0432\u043E\u0442\u043E \u0441\u0435\u043C\u0438 \u0441\u0435\u043C\u044C \u0441\u0435\u043C\u044C\u0435 \u0441\u0435\u043C\u044C\u0438 \u0441\u0435\u043C\u044C\u044F \u0441\u0435\u043D\u0442\u044F\u0431\u0440\u0435 \u0441\u0435\u043D\u0442\u044F\u0431\u0440\u0435\u0445\u044C \u0441\u0435\u043D\u0442\u044F\u0431\u0440\u044C \u0441\u0435\u043D\u0442\u044F\u0431\u0440\u044F \u0441\u0435\u043F\u0442\u0435\u043C\u0431\u0440\u0430 \u0441\u0435\u043F\u0442\u0435\u043C\u0432\u0440\u0438 \u0441\u0435\u0440\u0435\u0434 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u044B \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0456 \u0441\u0435\u0440\u0435\u0434\u043D\u044F \u0441\u0435\u0440\u0436\u0430\u043D\u0442 \u0441\u0435\u0440\u0438\u0430\u043B \u0441\u0435\u0440\u0438\u0430\u043B\u0430 \u0441\u0435\u0440\u0438\u0430\u043B\u0435 \u0441\u0435\u0440\u0438\u0438 \u0441\u0435\u0440\u0438\u044E \u0441\u0435\u0440\u0438\u044F \u0441\u0435\u0440\u043F\u043D\u044F \u0441\u0435\u0440\u043F\u043D\u0456 \u0441\u0435\u0440\u0456\u0457 \u0441\u0435\u0441\u0442\u0440\u0430 \u0441\u0435\u0442\u0438 \u0441\u0435\u0442\u044C \u0441\u0438\u0433\u043D\u0430\u043B \u0441\u0438\u043B \u0441\u0438\u043B\u0430 \u0441\u0438\u043B\u0430\u043C\u0438 \u0441\u0438\u043B\u0438 \u0441\u0438\u043B\u043D\u043E \u0441\u0438\u043B\u0443 \u0441\u0438\u043B\u044B \u0441\u0438\u043B\u044C\u043D\u043E \u0441\u0438\u043C\u0432\u043E\u043B \u0441\u0438\u043D \u0441\u0438\u043D\u0430 \u0441\u0438\u043D\u0433\u043B \u0441\u0438\u0441\u0442\u0435\u043C \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u0441\u0438\u0441\u0442\u0435\u043C\u0430\u04BB\u044B \u0441\u0438\u0441\u0442\u0435\u043C\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u0438 \u0441\u0438\u0441\u0442\u0435\u043C\u0438\u043D \u0441\u0438\u0441\u0442\u0435\u043C\u0443 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0441\u0438\u0441\u0442\u0435\u043C\u0456 \u0441\u0438\u0442\u0435 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438 \u0441\u0438\u0445 \u0441\u0438\u0445\u0430 \u0441\u0438\u044F\u049B\u0442\u044B \u0441\u043A\u0430\u0437\u0430\u043B \u0441\u043A\u043B\u0430\u0434 \u0441\u043A\u043B\u0430\u0434\u0430\u0435 \u0441\u043A\u043B\u0430\u0434\u0430\u0454\u0442\u044C\u0441\u044F \u0441\u043A\u043B\u0430\u0434\u0437\u0435 \u0441\u043A\u043B\u0430\u0434\u0443 \u0441\u043A\u043B\u0430\u0434\u0456 \u0441\u043A\u043E\u043D\u0447\u0430\u043B\u0441\u044F \u0441\u043A\u043E\u0440\u0435\u0435 \u0441\u043A\u043E\u0440\u043E \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0438 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0441\u043A\u0443\u043B\u044C\u043F\u0442\u043E\u0440 \u0441\u043B\u0430\u0431\u043E \u0441\u043B\u0430\u0432\u0430 \u0441\u043B\u0435\u0434 \u0441\u043B\u0435\u0434\u043D\u0438\u0442\u0435 \u0441\u043B\u0435\u0434\u0443\u0435\u0442 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u043C \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u043C \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0445 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0441\u043B\u043E\u0432 \u0441\u043B\u043E\u0432\u0430 \u0441\u043B\u043E\u0432\u0430\u043C \u0441\u043B\u043E\u0432\u0430\u043C\u0438 \u0441\u043B\u043E\u0432\u0430\u0440\u044C \u0441\u043B\u043E\u0432\u043E \u0441\u043B\u043E\u0436\u043D\u043E\u0441\u0442\u0438 \u0441\u043B\u0443\u0436\u0431\u0430 \u0441\u043B\u0443\u0436\u0431\u0435 \u0441\u043B\u0443\u0436\u0431\u0438 \u0441\u043B\u0443\u0436\u0431\u0443 \u0441\u043B\u0443\u0436\u0431\u044B \u0441\u043B\u0443\u0436\u0438 \u0441\u043B\u0443\u0436\u0438\u043B \u0441\u043B\u0443\u0436\u0438\u0442\u044C \u0441\u043B\u0443\u0447\u0430\u0435 \u0441\u043B\u0443\u0447\u0430\u0435\u0432 \u0441\u043B\u0443\u0447\u0430\u0438 \u0441\u043B\u0443\u0447\u0430\u0439 \u0441\u043B\u0443\u0447\u0430\u044F\u0445 \u0441\u043B\u0443\u0447\u0430\u0458 \u0441\u043B\u0456\u0434 \u0441\u043C\u0430\u0442\u0440\u0430 \u0441\u043C\u0435\u0440\u0442\u0438 \u0441\u043C\u0435\u0440\u0442\u044C \u0441\u043C\u0435\u0440\u0442\u0456 \u0441\u043C\u0435\u0440\u0446\u0456 \u0441\u043C\u0435\u0442\u0430 \u0441\u043C\u043E\u0433 \u0441\u043C\u043E\u0433\u043B\u0438 \u0441\u043C\u0440\u0442 \u0441\u043C\u0440\u0442\u0438 \u0441\u043C\u0442 \u0441\u043C\u044A\u0440\u0442\u0442\u0430 \u0441\u043D\u0430\u0433\u0430 \u0441\u043D\u0430\u0433\u0435 \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u043D\u0435\u0436\u043D\u044F \u0441\u043D\u043E\u0432\u0430 \u0441\u043D\u044F\u0442 \u0441\u043E\u0431\u043E\u0439 \u0441\u043E\u0431\u043E\u0440 \u0441\u043E\u0431\u043E\u0440\u0430 \u0441\u043E\u0431\u043E\u044E \u0441\u043E\u0431\u0440\u0430\u043D\u0438\u0435 \u0441\u043E\u0431\u0440\u0430\u043D\u0438\u044F \u0441\u043E\u0431\u044B\u0442\u0438\u0439 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u0441\u043E\u0431\u0456 \u0441\u043E\u0432 \u0441\u043E\u0432\u0435\u0440\u0448\u0435\u043D\u043D\u043E \u0441\u043E\u0432\u0435\u0440\u0448\u0438\u043B \u0441\u043E\u0432\u0435\u0442 \u0441\u043E\u0432\u0435\u0442\u0430 \u0441\u043E\u0432\u0435\u0442\u043D\u0438\u043A \u0441\u043E\u0432\u0435\u0442\u0441\u043A\u0430\u044F \u0441\u043E\u0432\u0435\u0442\u0441\u043A\u0438\u0439 \u0441\u043E\u0432\u0435\u0442\u0441\u043A\u0438\u0445 \u0441\u043E\u0432\u0435\u0442\u0441\u043A\u043E\u0433\u043E \u0441\u043E\u0432\u0435\u0442\u0441\u043A\u043E\u0439 \u0441\u043E\u0432\u0435\u0442\u044B \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u043E \u0441\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0433\u043E \u0441\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0439 \u0441\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u0441\u043E\u0433\u043B\u0430\u0441\u043D\u043E \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u0441\u043E\u0437\u0434\u0430\u043B \u0441\u043E\u0437\u0434\u0430\u043D \u0441\u043E\u0437\u0434\u0430\u043D\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u043E\u0437\u044B\u0432\u0430 \u0441\u043E\u043B \u0441\u043E\u043B\u0434\u0430\u0442 \u0441\u043E\u043B\u0438 \u0441\u043E\u043B\u043E \u0441\u043E\u043B\u0442\u04AF\u0441\u0442\u0456\u043A \u0441\u043E\u043D\u0434\u0430\u0439 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u0441\u043E\u043E\u0440\u0443\u0436\u0435\u043D\u0438\u0439 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043D\u043D\u043E \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0438 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0441\u043E\u0440\u0435\u0432\u043D\u043E\u0432\u0430\u043D\u0438\u0439 \u0441\u043E\u0440\u0435\u0432\u043D\u043E\u0432\u0430\u043D\u0438\u044F\u0445 \u0441\u043E\u0441\u0442 \u0441\u043E\u0441\u0442\u0430\u0432 \u0441\u043E\u0441\u0442\u0430\u0432\u0430 \u0441\u043E\u0441\u0442\u0430\u0432\u0435 \u0441\u043E\u0441\u0442\u0430\u0432\u0438\u043B \u0441\u043E\u0441\u0442\u0430\u0432\u0438\u043B\u0430 \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u043B \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u043B\u0430 \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u043B\u0438 \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u043B\u043E \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u044E\u0442 \u0441\u043E\u0441\u0442\u0430\u0432\u044B\u043D\u0430 \u0441\u043E\u0441\u0442\u043E\u0438\u0442 \u0441\u043E\u0441\u0442\u043E\u044F\u043B \u0441\u043E\u0441\u0442\u043E\u044F\u043B\u0430\u0441\u044C \u0441\u043E\u0441\u0442\u043E\u044F\u043B\u043E\u0441\u044C \u0441\u043E\u0441\u0442\u043E\u044F\u043B\u0441\u044F \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0438 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044E \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u0441\u043E\u0445\u0442\u0430\u0438 \u0441\u043E\u0446\u0438\u0430\u043B\u044C\u043D\u043E \u0441\u043E\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0439 \u0441\u043E\u0447\u0438\u043D\u0435\u043D\u0438\u0439 \u0441\u043E\u044E\u0437 \u0441\u043E\u044E\u0437\u0430 \u0441\u043E\u0455\u0432\u0435\u0437\u0434\u0438\u0435 \u0441\u043E\u0455\u0432\u0435\u0437\u0434\u0438\u0435\u0442\u043E \u0441\u043E\u04A3 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u044C\u043D\u043E \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u0441\u043F\u0438\u0440\u0430\u043B\u043D\u0430 \u0441\u043F\u0438\u0441\u043A\u0435 \u0441\u043F\u0438\u0441\u043A\u0443 \u0441\u043F\u0438\u0441\u043E\u043A \u0441\u043F\u0438\u0441\u043E\u043A\u043E\u0442 \u0441\u043F\u043E\u043C\u0435\u043D\u0443\u0432\u0430 \u0441\u043F\u043E\u0440\u0435\u0434 \u0441\u043F\u043E\u0440\u0442 \u0441\u043F\u043E\u0440\u0442\u0430 \u0441\u043F\u043E\u0440\u0442\u0443 \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u0438 \u0441\u043F\u043E\u0441\u043E\u0431\u043E\u043C \u0441\u043F\u043E\u0441\u0456\u0431 \u0441\u043F\u043E\u0447\u0430\u0442\u043A\u0443 \u0441\u043F\u0440\u0430\u0432 \u0441\u043F\u0440\u0430\u0432\u0430 \u0441\u043F\u0440\u0430\u0432\u0438 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u0441\u043F\u0440\u043E\u0432\u0435\u0434\u0435\u043D\u043E \u0441\u043F\u0443\u0441\u0442\u044F \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044E \u0441\u0440\u0430\u0436\u0435\u043D\u0438\u0438 \u0441\u0440\u0430\u0437\u0443 \u0441\u0440\u0435\u0434 \u0441\u0440\u0435\u0434\u0430\u0442\u0430 \u0441\u0440\u0435\u0434\u0438 \u0441\u0440\u0435\u0434\u0438\u0448\u0442\u0430 \u0441\u0440\u0435\u0434\u043D\u0435\u0433\u043E \u0441\u0440\u0435\u0434\u043D\u0435\u0439 \u0441\u0440\u0435\u0434\u043D\u0435\u043C \u0441\u0440\u0435\u0434\u043D\u0438\u0439 \u0441\u0440\u0435\u0434\u043D\u044F\u044F \u0441\u0440\u0435\u0434\u0441\u0442\u0432 \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u043E \u0441\u0440\u0435\u0434\u044B \u0441\u0440\u0435\u0434\u045A\u043E\u0458 \u0441\u0440\u0435\u0449\u0430 \u0441\u0440\u0435\u0449\u0443 \u0441\u0440\u0435\u045C\u0430\u0432\u0430 \u0441\u0440\u043E\u043A \u0441\u0440\u043F\u0441\u043A\u0435 \u0441\u0440\u043F\u0441\u043A\u0438 \u0441\u0440\u043F\u0441\u043A\u043E\u0433 \u0441\u0441\u044B\u043B\u043A\u0430 \u0441\u0442\u0430\u0432 \u0441\u0442\u0430\u0432\u0430 \u0441\u0442\u0430\u0433\u043E\u0434\u0434\u0437\u044F \u0441\u0442\u0430\u0434\u0438\u0438 \u0441\u0442\u0430\u0434\u0438\u043E\u043D \u0441\u0442\u0430\u043B \u0441\u0442\u0430\u043B\u0430 \u0441\u0442\u0430\u043B\u0438 \u0441\u0442\u0430\u043B\u043E \u0441\u0442\u0430\u043B\u0456 \u0441\u0442\u0430\u043D \u0441\u0442\u0430\u043D\u0430 \u0441\u0442\u0430\u043D\u0430\u043B \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442 \u0441\u0442\u0430\u043D\u0435 \u0441\u0442\u0430\u043D\u0438\u0446\u0430 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0430 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u043E \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u0442\u0430\u043D\u043E\u0432\u043D\u0438\u043A\u0430 \u0441\u0442\u0430\u043D\u043E\u0432\u043D\u0438\u0448\u0442\u0432\u0430 \u0441\u0442\u0430\u043D\u043E\u043C \u0441\u0442\u0430\u043D\u0443 \u0441\u0442\u0430\u043D\u0446\u0438\u0438 \u0441\u0442\u0430\u043D\u0446\u0438\u044F \u0441\u0442\u0430\u043D\u0446\u0456\u044F \u0441\u0442\u0430\u043D\u0446\u0456\u0457 \u0441\u0442\u0430\u0440\u043E\u0433\u043E \u0441\u0442\u0430\u0440\u043E\u0441\u0442 \u0441\u0442\u0430\u0440\u0448\u0435 \u0441\u0442\u0430\u0440\u0448\u0435\u0433\u043E \u0441\u0442\u0430\u0440\u0448\u0438\u0439 \u0441\u0442\u0430\u0440\u0448\u0438\u043C \u0441\u0442\u0430\u0442\u0435\u0439 \u0441\u0442\u0430\u0442\u0438 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430\u043B\u0430\u0440 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430\u043B\u044B\u049B \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430\u0441\u044B \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0435 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0443 \u0441\u0442\u0430\u0442\u0442\u044E \u0441\u0442\u0430\u0442\u0442\u0456 \u0441\u0442\u0430\u0442\u0443\u0441 \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u043C \u0441\u0442\u0430\u0442\u0443\u0441\u044B \u0441\u0442\u0430\u0442\u044C \u0441\u0442\u0430\u0442\u044C\u0435 \u0441\u0442\u0430\u0442\u044C\u0438 \u0441\u0442\u0430\u0442\u044C\u044F \u0441\u0442\u0430\u0454 \u0441\u0442\u0430\u045E \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u0430 \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u0438\u0439 \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u0441\u0442\u0432\u043E\u0440\u0438\u0432 \u0441\u0442\u0435\u043D\u044B \u0441\u0442\u0435\u043F\u0435\u043D \u0441\u0442\u0435\u043F\u0435\u043D\u0435\u0439 \u0441\u0442\u0435\u043F\u0435\u043D\u0438 \u0441\u0442\u0435\u043F\u0435\u043D\u044C \u0441\u0442\u0438\u0433\u0430\u043B \u0441\u0442\u0438\u043B \u0441\u0442\u0438\u043B\u0435 \u0441\u0442\u0438\u043B\u044C \u0441\u0442\u0438\u043B\u044E \u0441\u0442\u0438\u043B\u0456 \u0441\u0442\u0438\u0445\u0438 \u0441\u0442\u043E \u0441\u0442\u043E\u0438\u0442 \u0441\u0442\u043E\u043B\u0438\u0446\u0430 \u0441\u0442\u043E\u043B\u0438\u0446\u044B \u0441\u0442\u043E\u043B\u0438\u0446\u0456 \u0441\u0442\u043E\u043B\u0456\u0442\u0442\u044F \u0441\u0442\u043E\u043B\u0456\u0442\u0442\u0456 \u0441\u0442\u043E\u0440\u043E\u043D \u0441\u0442\u043E\u0440\u043E\u043D\u0430 \u0441\u0442\u043E\u0440\u043E\u043D\u0435 \u0441\u0442\u043E\u0440\u043E\u043D\u0443 \u0441\u0442\u043E\u0440\u043E\u043D\u044B \u0441\u0442\u043E\u044C\u043C\u0430\u0448 \u0441\u0442\u043E\u044C\u043C\u0438\u0439\u043D \u0441\u0442\u0440 \u0441\u0442\u0440\u0430\u043D \u0441\u0442\u0440\u0430\u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0430\u0442\u0430 \u0441\u0442\u0440\u0430\u043D\u0430\u0445 \u0441\u0442\u0440\u0430\u043D\u0435 \u0441\u0442\u0440\u0430\u043D\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0441\u0442\u0440\u0430\u043D\u0443 \u0441\u0442\u0440\u0430\u043D\u044B \u0441\u0442\u0440\u0435\u043B\u043A\u043E\u0432\u043E\u0433\u043E \u0441\u0442\u0440\u0435\u043B\u043A\u043E\u0432\u043E\u0439 \u0441\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u0430 \u0441\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u0435 \u0441\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0438 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B \u0441\u0442\u0443\u0434\u0435\u043D\u0442 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430\u043C\u0438 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0456\u0432 \u0441\u0442\u0443\u0434\u0437\u0435\u043D\u044F \u0441\u0442\u0443\u0434\u0438\u0438 \u0441\u0442\u0443\u043F\u0435\u043D\u044F \u0441\u0442\u0443\u043F\u0456\u043D\u044C \u0441\u0443\u0431\u044A\u0435\u043A\u0442\u043E\u0432 \u0441\u0443\u0432\u044F\u0437\u0456 \u0441\u0443\u0434 \u0441\u0443\u0434\u0430 \u0441\u0443\u0434\u043D\u0430 \u0441\u0443\u0434\u043D\u043E \u0441\u0443\u0434\u043E\u0432 \u0441\u0443\u0434\u0443 \u0441\u0443\u0437\u043E\u0440 \u0441\u0443\u0437\u0456\u0440 \u0441\u0443\u043B \u0441\u0443\u043B\u0430\u0445\u0430\u0439 \u0441\u0443\u043B\u0442\u0430\u043D \u0441\u0443\u043C \u0441\u0443\u043C\u0435\u043B \u0441\u0443\u043F\u0440\u0430\u0446\u044C \u0441\u0443\u0441\u043F\u0456\u043B\u044C\u0441\u0442\u0432\u0430 \u0441\u0443\u0443 \u0441\u0443\u0447\u0430\u0441\u043D\u0438\u0445 \u0441\u0443\u0447\u0430\u0441\u043D\u043E\u0433\u043E \u0441\u0443\u0447\u0430\u0441\u043D\u043E\u0457 \u0441\u0443\u0448\u0430\u0440\u0443\u0430\u0448\u044B\u043B\u044B\u0493\u044B \u0441\u0443\u0448\u0430\u0440\u0443\u0430\u0448\u044B\u043B\u044B\u049B \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043E\u0432\u0430\u043D\u0438\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043E\u0432\u0430\u043D\u0438\u044F \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0442 \u0441\u0443\u044B\u043A \u0441\u0444\u0435\u0440\u0435 \u0441\u0445\u043E\u0434\u0456 \u0441\u0445\u0456\u0434 \u0441\u0446\u0435\u043D\u0430 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0441\u0442 \u0441\u0446\u0435\u043D\u0435 \u0441\u0446\u0435\u043D\u0438 \u0441\u0446\u0435\u043D\u044B \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0441\u0447\u0438\u0442\u0430\u043B \u0441\u0447\u0438\u0442\u0430\u044E\u0442 \u0441\u0447\u0451\u0442 \u0441\u0447\u0451\u0442\u043E\u043C \u0441\u044A\u0432\u0435\u0442 \u0441\u044A\u0437\u0434\u0430\u0432\u0430 \u0441\u044A\u043F\u0440\u0443\u0433\u0430 \u0441\u044A\u043F\u0440\u0443\u0433\u0430\u0442\u0430 \u0441\u044A\u0441 \u0441\u044A\u0441\u0442\u0430\u0432\u0430 \u0441\u044A\u0441\u0442\u043E\u0438 \u0441\u044A\u0449\u0430\u0442\u0430 \u0441\u044A\u0449\u043E \u0441\u044A\u044E\u0437 \u0441\u044B\u0433\u0440\u0430\u043B \u0441\u044B\u043D \u0441\u044B\u043D\u0430 \u0441\u044B\u043D\u043E\u0432\u0435\u0439 \u0441\u044B\u043D\u043E\u043C \u0441\u044B\u0493\u0430 \u0441\u044B\u0493\u0430\u043D\u0430\u04A1\u0442\u0430\u043D \u0441\u044B\u0493\u0430\u0440\u044B\u043B\u044B\u0448 \u0441\u044C\u043E\u0433\u043E\u0434\u043D\u0456 \u0441\u044E\u0436\u0435\u0442 \u0441\u044E\u0440 \u0441\u044F\u0431\u0435 \u0441\u044F\u043C \u0441\u044F\u0440\u043E\u0434 \u0441\u0456\u043B \u0441\u0456\u043B\u044C\u0441\u044C\u043A\u0430 \u0441\u0456\u043B\u044C\u0441\u044C\u043A\u043E\u0433\u043E \u0441\u0456\u043B\u044C\u0441\u044C\u043A\u043E\u0457 \u0441\u0456\u043C \u0441\u0456\u0447\u043D\u044F \u0441\u0456\u0447\u043D\u0456 \u0441\u0458\u0430\u0458 \u0441\u04D9\u0431\u04D9\u043F\u043B\u0435 \u0441\u04D9\u0433\u0430\u0442\u044C \u0441\u04D9\u0439\u043A\u0435\u0441 \u0441\u04E9\u0437 \u0441\u04E9\u0437\u0434\u0456\u0433\u0456 \u0441\u04E9\u0437\u0434\u0456\u043A \u0441\u04E9\u0437\u0434\u04AF\u0433\u04AF \u0442\u0103\u0440\u0103\u0445\u0115 \u0442\u0103\u0440\u0448\u0448\u0115 \u0442\u0115\u043F\u0447\u0435\u0432\u043B\u0435\u043D\u04F3 \u0442\u0430\u0430 \u0442\u0430\u0431\u0438\u0433\u0430\u0442\u044C \u0442\u0430\u0431\u0438\u0433\u044B\u0439 \u0442\u0430\u0431\u043B\u0438\u0446\u0430 \u0442\u0430\u0431\u044B\u043B\u0430\u0434\u044B \u0442\u0430\u0432 \u0442\u0430\u0433\u043E \u0442\u0430\u0434\u0430 \u0442\u0430\u0437\u0438 \u0442\u0430\u0439\u043D\u0430 \u0442\u0430\u043A \u0442\u0430\u043A\u0430 \u0442\u0430\u043A\u0436\u0435 \u0442\u0430\u043A\u0438 \u0442\u0430\u043A\u0438\u0435 \u0442\u0430\u043A\u0438\u0439 \u0442\u0430\u043A\u0438\u043C \u0442\u0430\u043A\u0438\u043C\u0438 \u0442\u0430\u043A\u0438\u0445 \u0442\u0430\u043A\u043E \u0442\u0430\u043A\u043E\u0433\u043E \u0442\u0430\u043A\u043E\u0435 \u0442\u0430\u043A\u043E\u0436 \u0442\u0430\u043A\u043E\u0439 \u0442\u0430\u043A\u043E\u043C\u0443 \u0442\u0430\u043A\u043E\u0452\u0435 \u0442\u0430\u043A\u0441\u0430\u043C\u0430 \u0442\u0430\u043A\u0456 \u0442\u0430\u043C \u0442\u0430\u043C\u0430\u0433\u044B \u0442\u0430\u043C\u0430\u0493\u044B\u043D\u0430\u043D \u0442\u0430\u043C\u0443 \u0442\u0430\u043D\u043A \u0442\u0430\u043D\u043A\u0430 \u0442\u0430\u043D\u043A\u043E\u0432 \u0442\u0430\u043F\u04A1\u044B\u0440 \u0442\u0430\u0440\u0430\u0431\u044B\u043D\u0430\u043D \u0442\u0430\u0440\u0430\u043D \u0442\u0430\u0440\u0430\u0444\u044B\u043D\u0430\u043D \u0442\u0430\u0440\u0438\u0445\u0438 \u0442\u0430\u0440\u0438\u0445\u044B \u0442\u0430\u0440\u043C\u0430\u0493\u044B\u043D\u044B\u04A3 \u0442\u0430\u0442\u0430 \u0442\u0430\u0442\u0430\u0440 \u0442\u0430\u0443 \u0442\u0430\u0458 \u0442\u0430\u0493\u044B \u0442\u0432\u0430\u0440\u0438\u043D \u0442\u0432\u043E\u0440\u0438 \u0442\u0432\u043E\u0440\u0447\u0435\u0441\u0442\u0432\u0430 \u0442\u0432\u043E\u0440\u0447\u0435\u0441\u0442\u0432\u043E \u0442\u0432\u043E\u0440\u0447\u043E\u0441\u0442\u0456 \u0442\u0432\u043E\u0440\u0456\u0432 \u0442\u0435\u0430\u0442\u0440 \u0442\u0435\u0430\u0442\u0440\u0430 \u0442\u0435\u0430\u0442\u0440\u0435 \u0442\u0435\u0430\u0442\u0440\u0443 \u0442\u0435\u0430\u0442\u0440\u044B \u0442\u0435\u0436 \u0442\u0435\u0437 \u0442\u0435\u0437\u0438 \u0442\u0435\u043A \u0442\u0435\u043A\u043E\u0442 \u0442\u0435\u043A\u0441\u0442 \u0442\u0435\u043A\u0441\u0442\u0430 \u0442\u0435\u043B \u0442\u0435\u043B\u0430 \u0442\u0435\u043B\u0435 \u0442\u0435\u043B\u0435\u0441\u043A\u043E\u043F \u0442\u0435\u043B\u043E \u0442\u0435\u043C \u0442\u0435\u043C\u0430 \u0442\u0435\u043C\u0435 \u0442\u0435\u043C\u0438 \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430 \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430\u043D \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430\u0441\u044B \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0438 \u0442\u0435\u043C\u0443 \u0442\u0435\u043E\u0440\u0438\u0438 \u0442\u0435\u043E\u0440\u0438\u044F \u0442\u0435\u043E\u0440\u0456\u0457 \u0442\u0435\u043F\u0435\u0440 \u0442\u0435\u043F\u0435\u0440\u044C \u0442\u0435\u0440\u0438\u0442\u043E\u0440\u0438\u044F\u0442\u0430 \u0442\u0435\u0440\u0438\u0442\u043E\u0440\u0456\u044E \u0442\u0435\u0440\u0438\u0442\u043E\u0440\u0456\u044F \u0442\u0435\u0440\u0438\u0442\u043E\u0440\u0456\u0457 \u0442\u0435\u0440\u043C\u0438\u043D \u0442\u0435\u0440\u043C\u0438\u043D\u0434\u0435\u0440\u0456\u043D\u0456\u04A3 \u0442\u0435\u0440\u043C\u0456\u043D \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u0430\u043B\u044C\u043D\u044B\u0445 \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u0438 \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u0439 \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u043D \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u043D\u0447\u0438 \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u043F\u0435 \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u044E \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u044F \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u044F\u0441\u0435\u043D\u043D\u04D9\u043D \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u044F\u0441\u044B\u043D \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u044F\u0441\u044B\u043D\u044B\u043D \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u044F\u04BB\u044B\u043D \u0442\u0435\u0445 \u0442\u0435\u0445\u043D\u0438\u043A\u0430 \u0442\u0435\u0445\u043D\u0438\u043A\u0438 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0438 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0439 \u0442\u0435\u0445\u043D\u0456\u043A\u0438 \u0442\u0435\u0447\u0435 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u0442\u0435\u04A3 \u0442\u0438\u0433\u04D9\u043D \u0442\u0438\u0435 \u0442\u0438\u043A\u043B\u0435\u043C \u0442\u0438\u043A\u0448\u0435\u0440\u0435\u043B\u0433\u04D9\u043D \u0442\u0438\u043B \u0442\u0438\u043C \u0442\u0438\u043C\u0435\u0440 \u0442\u0438\u043F \u0442\u0438\u043F\u0430 \u0442\u0438\u043F\u0442\u0456 \u0442\u0438\u043F\u0443 \u0442\u0438\u0441 \u0442\u0438\u0441\u044F\u0447 \u0442\u0438\u0442\u0443\u043B \u0442\u0438\u0442\u0443\u043B\u0430 \u0442\u0438\u0445 \u0442\u043A\u044A\u0430 \u0442\u043E\u0430 \u0442\u043E\u0431\u0442\u043E \u0442\u043E\u0432\u0430 \u0442\u043E\u0432\u0430\u0440\u0438\u0441\u0442\u0432\u0430 \u0442\u043E\u0433 \u0442\u043E\u0433\u0430 \u0442\u043E\u0433\u0430\u0432\u0430 \u0442\u043E\u0433\u0434\u0430 \u0442\u043E\u0433\u043E \u0442\u043E\u0434\u0456 \u0442\u043E\u0436\u0435 \u0442\u043E\u0437\u0438 \u0442\u043E\u0439 \u0442\u043E\u043A \u0442\u043E\u043A\u0430 \u0442\u043E\u043A\u043E\u043C \u0442\u043E\u043A\u0443 \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u043E\u043B\u044C\u043A\u0456 \u0442\u043E\u043C \u0442\u043E\u043C\u0430 \u0442\u043E\u043C\u0430\u0445 \u0442\u043E\u043C\u0435 \u0442\u043E\u043C\u0443 \u0442\u043E\u043C\u0443\u043D\u0443\u043D \u0442\u043E\u043C\u044B \u0442\u043E\u043C\u044B\u043D\u044B\u04A3 \u0442\u043E\u043D\u043D \u0442\u043E\u043E \u0442\u043E\u043F \u0442\u043E\u0440\u0430 \u0442\u043E\u0440\u0430\u043A \u0442\u043E\u0440\u0433\u0430\u043D \u0442\u043E\u0440\u0433\u043E\u0432\u043B\u0438 \u0442\u043E\u0440\u0443\u0447\u044B \u0442\u043E\u0440\u0493\u0430\u043D \u0442\u043E\u0442 \u0442\u043E\u0447\u043A\u0430 \u0442\u043E\u0447\u043A\u0438 \u0442\u043E\u0447\u043D\u043E \u0442\u043E\u0449\u043E \u0442\u043E\u0458 \u0442\u043E\u04B7\u0438\u043A \u0442\u0440\u0430\u0432\u043D\u044F \u0442\u0440\u0430\u0432\u043D\u0456 \u0442\u0440\u0430\u0434\u0438\u0446\u0438\u0438 \u0442\u0440\u0430\u043D\u0441\u043B\u0456\u0442 \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442 \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u0430 \u0442\u0440\u0435\u0431\u0430 \u0442\u0440\u0435\u0431\u0430\u043B\u043E \u0442\u0440\u0435\u043C\u044F \u0442\u0440\u0435\u043D\u0435\u0440 \u0442\u0440\u0435\u043D\u0435\u0440\u0430 \u0442\u0440\u0435\u043D\u0435\u0440\u043E\u043C \u0442\u0440\u0435\u0442\u0438 \u0442\u0440\u0435\u0442\u0438\u0439 \u0442\u0440\u0435\u0442\u044C\u0435\u0433\u043E \u0442\u0440\u0435\u0442\u044C\u0435\u0439 \u0442\u0440\u0435\u0445 \u0442\u0440\u0438 \u0442\u0440\u043E\u043D \u0442\u0440\u0443\u0434 \u0442\u0440\u0443\u0434\u0430 \u0442\u0440\u044C\u043E\u0445 \u0442\u0440\u044F\u0431\u0432\u0430 \u0442\u0440\u0451\u0445 \u0442\u0443\u0440 \u0442\u0443\u0440\u0430 \u0442\u0443\u0440\u0430\u043B\u044B \u0442\u0443\u0440\u0430\u0442 \u0442\u0443\u0440\u0430\u04BB\u044B\u043D\u0434\u0430 \u0442\u0443\u0440\u0433\u0430\u043D \u0442\u0443\u0440\u043D\u0438\u0440 \u0442\u0443\u0440\u043D\u0438\u0440\u0430 \u0442\u0443\u0440\u043D\u0438\u0440\u0435 \u0442\u0443\u0440\u043D\u0456\u0440\u0443 \u0442\u0443\u0440\u0441\u043A\u0438 \u0442\u0443\u0441 \u0442\u0443\u0442 \u0442\u0443\u0445\u0430\u0439 \u0442\u0443\u0493\u0430\u043D \u0442\u044A\u0439 \u0442\u044B\u043C \u0442\u044B\u043F\u0443 \u0442\u044B\u0441 \u0442\u044B\u0441\u044F\u0447 \u0442\u044B\u0441\u044F\u0447\u0438 \u0442\u044B\u0443\u0493\u0430\u043D \u0442\u044B\u0493\u044B\u0437\u0434\u044B\u0493\u044B \u0442\u044B\u04A3 \u0442\u044D\u043C\u0435 \u0442\u044D\u0440\u044B\u0442\u043E\u0440\u044B\u0456 \u0442\u044F\u0445 \u0442\u0456\u0437\u0456\u043B\u0456\u043C\u0456\u043D\u0456\u04A3 \u0442\u0456\u0437\u0456\u043C\u0456 \u0442\u0456\u0437\u0456\u043C\u0456\u043D\u0435 \u0442\u0456\u043B\u0430 \u0442\u0456\u043B\u044C\u043A\u0438 \u0442\u0456\u043B\u0456 \u0442\u0456\u0440\u043A\u0435\u0443 \u0442\u04AF\u0433\u0435\u043B \u0442\u04AF\u043F\u043D\u04B1\u0441\u049B\u0430 \u0442\u04AF\u043F\u043D\u04B1\u0441\u049B\u0430\u0441\u044B\u043D\u0434\u0430\u0493\u044B \u0442\u04AF\u0440\u0434\u0435 \u0442\u04AF\u0440\u043B\u0456 \u0442\u04AF\u0440\u0456 \u0442\u04AF\u0441\u0442\u0456 \u0442\u04AF\u0441\u0456\u043D\u0434\u0456\u0440\u043C\u0435 \u0442\u04AF\u04AF\u043D\u0438\u0439 \u0442\u04B1\u0440\u0430\u0434\u044B \u0442\u04B1\u0440\u0430\u049B\u0442\u044B \u0442\u04B1\u0440\u0493\u044B\u0434\u0430\u043D \u0442\u04B1\u0440\u0493\u044B\u043D\u0434\u0430\u0440 \u0442\u04B1\u0440\u0493\u044B\u043D\u0434\u0430\u0440\u044B\u043D\u044B\u04A3 \u0442\u04D9\u0431\u0438\u0493\u04D9\u0442 \u0442\u04D9\u0440\u0456\u0437\u0434\u0456 \u0442\u04D9\u0448\u043A\u0438\u043B \u0442\u04E9\u043F \u0442\u04E9\u0440\u043B\u04E9 \u0442\u04E9\u0440\u0441\u04E9\u043D \u0442\u04E9\u0440\u0442 \u0442\u04E9\u0448\u04D9 \u0442\u04EF\u043B\u0438 \u0443\u0431\u0438\u0439\u0441\u0442\u0432\u0430 \u0443\u0431\u0438\u0442 \u0443\u0432\u0430\u0433\u0443 \u0443\u0432\u0430\u0445\u043E\u0434\u0437\u0456\u0446\u044C \u0443\u0432\u0435\u043A \u0443\u0433\u0433\u0430\u0440 \u0443\u0433\u0433\u0430\u0440\u0435 \u0443\u0433\u043B\u0430\u0432\u043D\u043E\u043C \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u0440 \u0443\u0434\u043E\u0441\u0442\u043E\u0435\u043D \u0443\u0435\u0437\u0434 \u0443\u0435\u0437\u0434\u0430 \u0443\u0436\u0435 \u0443\u0437\u0443\u043D\u0434\u0443\u0433\u0443 \u0443\u0439\u0103\u0445\u0115\u043D \u0443\u043A\u0430\u0437\u043E\u043C \u0443\u043A\u0440 \u0443\u043A\u0440\u0430\u0438\u043D\u0441\u043A\u0438\u0439 \u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430 \u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0438\u0439 \u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0438\u0445 \u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u043E\u0433\u043E \u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u043E\u0457 \u0443\u043A\u0440\u0430\u0457\u043D\u0446\u0456\u0432 \u0443\u043A\u0443\u043F\u043D\u043E \u0443\u043A\u0459\u0443\u0447\u0443\u0458\u0443\u045B\u0438 \u0443\u043B\u0430\u0440 \u0443\u043B\u0438\u0446 \u0443\u043B\u0438\u0446\u0430 \u0443\u043B\u0438\u0446\u0435 \u0443\u043B\u0438\u0446\u044B \u0443\u043B\u043E\u0433\u0430 \u0443\u043B\u043E\u0433\u0443 \u0443\u043B\u0441 \u0443\u043B\u0441\u044B\u043D \u0443\u043B\u0443\u0442\u0442\u0443\u043A \u0443\u043B\u044B \u0443\u043C\u0435\u0440 \u0443\u043C\u0435\u0442\u043D\u043E\u0441\u0442\u0438 \u0443\u043C\u0438\u0440\u0430 \u0443\u043C\u043E\u0432 \u0443\u043C\u043E\u0432\u0430\u0445 \u0443\u043C\u043E\u0432\u0438 \u0443\u043C\u0443\u043C\u04E3 \u0443\u043D\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442 \u0443\u043D\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442\u0430 \u0443\u043D\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442\u0435 \u0443\u043D\u044B \u0443\u043D\u044B\u04A3 \u0443\u043D\u0456\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442 \u0443\u043D\u0456\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442\u0443 \u0443\u043D\u0456\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442\u0456 \u0443\u043F\u043E\u043C\u0438\u043D\u0430\u0435\u0442\u0441\u044F \u0443\u043F\u043E\u0442\u0440\u0435\u0431\u0430 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0443\u043F\u0440\u0430\u0432\u043B\u0456\u043D\u043D\u044F \u0443\u0440\u0430\u043D \u0443\u0440\u043D\u0430\u0448\u043A\u0430\u043D \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u0443\u0440\u043E\u0432\u043D\u0435 \u0443\u0440\u043E\u0432\u043D\u0435\u043C \u0443\u0440\u043E\u0432\u043D\u044F \u0443\u0440\u0442\u0430\u0447\u0430 \u0443\u0440\u044B\u043D\u043B\u0430\u0448\u04A1\u0430\u043D \u0443\u0440\u044B\u043D\u044B \u0443\u0440\u044B\u04AB \u0443\u0440\u044F\u0434 \u0443\u0440\u044F\u0434\u0443 \u0443\u0441\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u0439 \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u0443\u0441\u043B\u043E\u0432\u0438\u044F\u0445 \u0443\u0441\u043B\u0443\u0433\u0438 \u0443\u0441\u043F\u0435\u0445 \u0443\u0441\u043F\u0435\u0445\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0441\u043F\u044F\u0432\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u0443\u0441\u0442\u044C\u044F \u0443\u0441\u0456 \u0443\u0441\u0456\u0445 \u0443\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F \u0443\u0447\u0430\u0441\u043D\u0438\u043A \u0443\u0447\u0430\u0441\u043D\u0438\u043A\u0456\u0432 \u0443\u0447\u0430\u0441\u0442\u0432\u0430 \u0443\u0447\u0430\u0441\u0442\u0432\u043E\u0432\u0430\u043B \u0443\u0447\u0430\u0441\u0442\u0432\u043E\u0432\u0430\u043B\u0430 \u0443\u0447\u0430\u0441\u0442\u0432\u043E\u0432\u0430\u043B\u0438 \u0443\u0447\u0430\u0441\u0442\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u0438\u0435\u043C \u0443\u0447\u0430\u0441\u0442\u0438\u0438 \u0443\u0447\u0430\u0441\u0442\u0438\u044F \u0443\u0447\u0430\u0441\u0442\u043A\u0430 \u0443\u0447\u0430\u0441\u0442\u043A\u0430\u04BB\u044B \u0443\u0447\u0430\u0441\u0442\u043A\u0435 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u0443\u0447\u0430\u0441\u0442\u043E\u0433\u044B \u0443\u0447\u0430\u0441\u0442\u043E\u043A \u0443\u0447\u0430\u0441\u0442\u043E\u043A\u0115 \u0443\u0447\u0430\u0441\u0442\u044C \u0443\u0447\u0430\u0441\u0442\u0456 \u0443\u0447\u0435\u0431\u043D\u044B\u0445 \u0443\u0447\u0438 \u0443\u0447\u0438\u043B\u0438\u0449\u0430 \u0443\u0447\u0438\u043B\u0438\u0449\u0435 \u0443\u0447\u0438\u043B\u0441\u044F \u0443\u0447\u0438\u0442\u0435\u043B \u0443\u0447\u043D\u044F\u043C\u0438 \u0443\u0447\u0443\u0440\u0434\u0430 \u0443\u0447\u0451\u043D\u044B\u0439 \u0443\u0448\u0442\u0435 \u0443\u0448\u0451\u043B \u0443\u044C\u0448 \u0444\u0430\u0431\u0440\u0438\u043A\u0430 \u0444\u0430\u0437\u0430 \u0444\u0430\u043A\u0442 \u0444\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0444\u0430\u043A\u0442\u043E\u0440 \u0444\u0430\u043A\u0443\u043B\u0442\u0435\u0442 \u0444\u0430\u043A\u0443\u043B\u044C\u0442\u0435\u0442 \u0444\u0430\u043A\u0443\u043B\u044C\u0442\u0435\u0442\u0430 \u0444\u0435\u0431\u0440\u0443\u0430\u0440 \u0444\u0435\u0431\u0440\u0443\u0430\u0440\u0430 \u0444\u0435\u0432\u0440\u0430\u043B\u0435 \u0444\u0435\u0432\u0440\u0430\u043B\u0435\u0445\u044C \u0444\u0435\u0432\u0440\u0430\u043B\u044C \u0444\u0435\u0432\u0440\u0430\u043B\u044F \u0444\u0435\u0432\u0440\u0443\u0430\u0440\u0438 \u0444\u0435\u0434\u0435\u0440\u0430\u043B\u0434\u044B \u0444\u0435\u0434\u0435\u0440\u0430\u043B\u0434\u044B\u043A \u0444\u0435\u0434\u0435\u0440\u0430\u043B\u044C \u0444\u0435\u0434\u0435\u0440\u0430\u043B\u044C\u043D\u044B\u0445 \u0444\u0435\u0434\u0435\u0440\u0430\u0446\u0438 \u0444\u0435\u0441\u0442\u0438\u0432\u0430\u043B\u0435 \u0444\u0435\u0441\u0442\u0438\u0432\u0430\u043B\u044C \u0444\u0435\u0441\u0442\u0438\u0432\u0430\u043B\u044F \u0444\u0438\u0437\u0438\u043A \u0444\u0438\u0437\u0438\u043A\u0430 \u0444\u0438\u0437\u0438\u043A\u0438 \u0444\u0438\u0437\u0438\u043A\u043E \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u0444\u0438\u043B\u043C \u0444\u0438\u043B\u043C\u0430 \u0444\u0438\u043B\u043E\u0441\u043E\u0444\u0438\u0438 \u0444\u0438\u043B\u043E\u0441\u043E\u0444\u0438\u044F \u0444\u0438\u043B\u044C\u043C \u0444\u0438\u043B\u044C\u043C\u0430 \u0444\u0438\u043B\u044C\u043C\u0430\u0445 \u0444\u0438\u043B\u044C\u043C\u0435 \u0444\u0438\u043B\u044C\u043C\u043E\u0432 \u0444\u0438\u043D\u0430\u043B \u0444\u0438\u043D\u0430\u043B\u0430 \u0444\u0438\u043D\u0430\u043B\u0435 \u0444\u043B\u043E\u0442 \u0444\u043B\u043E\u0442\u0430 \u0444\u043B\u043E\u0442\u0443 \u0444\u043E\u043D \u0444\u043E\u043D\u0434 \u0444\u043E\u043D\u0434\u0430 \u0444\u043E\u043D\u0434\u0443 \u0444\u043E\u043D\u0435 \u0444\u043E\u0440\u043C \u0444\u043E\u0440\u043C\u0430 \u0444\u043E\u0440\u043C\u0430\u0442 \u0444\u043E\u0440\u043C\u0430\u0442\u0430 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 \u0444\u043E\u0440\u043C\u0435 \u0444\u043E\u0440\u043C\u0438 \u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0444\u043E\u0440\u043C\u0443 \u0444\u043E\u0440\u043C\u0443\u0432\u0430\u043D\u043D\u044F \u0444\u043E\u0440\u043C\u044B \u0444\u043E\u0440\u043C\u0456 \u0444\u043E\u0440\u0442\u0435\u043F\u0438\u0430\u043D\u043E \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438 \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0441\u043A\u0430 \u0444\u0440\u0430\u043D \u0444\u0440\u0430\u043D\u0446 \u0444\u0440\u0430\u043D\u0446\u0443\u0437 \u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u0430\u0439 \u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u0438\u0439 \u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u043E\u0433\u043E \u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u043E\u0439 \u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0448\u0430 \u0444\u0440\u0430\u043D\u0446\u0443\u0441\u043A\u0438 \u0444\u0440\u0435\u043D\u0441\u043A\u0438 \u0444\u0440\u043E\u043D\u0442 \u0444\u0440\u043E\u043D\u0442\u0430 \u0444\u0440\u043E\u043D\u0442\u0430\u0445 \u0444\u0440\u043E\u043D\u0442\u0435 \u0444\u0440\u043E\u043D\u0442\u0443 \u0444\u0443\u043D\u043A\u0446\u0438\u0438 \u0444\u0443\u043D\u043A\u0446\u0438\u044F \u0444\u0443\u043D\u043A\u0446\u0438\u0458\u0430 \u0444\u0443\u043D\u043A\u0446\u0456\u0457 \u0444\u0443\u0440\u0443\u0434\u0433\u043E\u04B3 \u0444\u0443\u0440\u0443\u0434\u0433\u043E\u04B3\u0438 \u0444\u0443\u0440\u0443\u0434\u0433\u043E\u04B3\u04B3\u043E\u0438 \u0444\u0443\u0440\u0443\u0434\u0438 \u0444\u0443\u0442\u0431\u043E\u043B \u0444\u0443\u0442\u0431\u043E\u043B\u0431\u043E\u0437\u0438 \u0444\u0443\u0442\u0431\u043E\u043B\u0438\u0441\u0442 \u0444\u0443\u0442\u0431\u043E\u043B\u0443 \u0444\u0443\u0442\u0431\u043E\u043B\u0456\u0441\u0442 \u0444\u0456\u043B\u044C\u043C \u0444\u0456\u043B\u044C\u043C\u0443 \u0444\u0456\u043B\u044C\u043C\u0456 \u0444\u0456\u043D\u0430\u043B\u0443 \u0445\u0430\u0430\u043D \u0445\u0430\u0431\u0430\u0440\u043D\u0438\u0433\u043E\u0440\u0438\u0438 \u0445\u0430\u043B\u0103\u0445 \u0445\u0430\u043B\u044B\u043A \u0445\u0430\u043B\u044B\u043A\u043B\u0430\u0440 \u0445\u0430\u043B\u044B\u049B \u0445\u0430\u043B\u044B\u04A1 \u0445\u0430\u043C\u0433\u0438\u0439\u043D \u0445\u0430\u043D \u0445\u0430\u043D\u0430 \u0445\u0430\u043D\u0434\u0441\u0430\u043D \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440 \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043A\u0438 \u0445\u0430\u0441\u0442\u043E\u044C\u043C\u0430\u0448 \u0445\u0430\u0442\u0115\u0440\u043B\u0435\u043D\u0115 \u0445\u0432\u0438\u043B\u0438\u043D \u0445\u0435\u043D\u0430\u043D \u0445\u0435\u043D\u0430\u0446\u0430 \u0445\u0435\u0440\u0446\u043E\u0433 \u0445\u0438\u0439\u0446\u0430\u0434\u0430\u043B\u0430\u0440 \u0445\u0438\u043B\u0430\u0440 \u0445\u0438\u043B\u0430\u0440\u043E \u0445\u0438\u043C\u0438\u0438 \u0445\u0438\u043C\u0438\u044F \u0445\u0438\u0442 \u0445\u043E\u0434 \u0445\u043E\u0434\u0435 \u0445\u043E\u0434\u0443 \u0445\u043E\u0434\u0456 \u0445\u043E\u0437\u044F\u0439\u0441\u0442\u0432 \u0445\u043E\u0437\u044F\u0439\u0441\u0442\u0432\u0430 \u0445\u043E\u0437\u044F\u0439\u0441\u0442\u0432\u043E \u0445\u043E\u0440 \u0445\u043E\u0440\u0430 \u0445\u043E\u0440\u0430\u0442\u0430 \u0445\u043E\u0440\u043E\u0448\u043E \u0445\u043E\u0442 \u0445\u043E\u0442\u0435\u043B \u0445\u043E\u0442\u044F \u0445\u043E\u0447\u0430 \u0445\u043E\u0451\u0440 \u0445\u0440\u0430\u043C \u0445\u0440\u0430\u043C\u0430 \u0445\u0440\u0430\u043C\u0443 \u0445\u0440\u043E\u043C\u043E\u0441\u043E\u043C\u0438 \u0445\u0442\u043E \u0445\u0443\xE7\u0103\u043B\u0430\u0445 \u0445\u0443\xE7\u0430\u043B\u0103\u0445 \u0445\u0443\u0434 \u0445\u0443\u0434\u043E\u0436\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0445\u0443\u0434\u043E\u0436\u043D\u0438\u043A \u0445\u0443\u0434\u043E\u0436\u043D\u0438\u043A\u0430 \u0445\u0443\u0434\u043E\u0436\u043D\u0438\u043A\u043E\u0432 \u0445\u0443\u0434\u0440\u043E \u0445\u0443\u0436\u0430\u043B\u044B\u0493\u044B \u0445\u0443\u0442\u043E\u0440 \u0445\u0443\u044C\u043B\u0443 \u0445\u0443\u0497\u0430\u043B\u044B\u0433\u044B \u0445\u044B\xE7\xE7\u0103\u043D \u0445\u044B\u043F\u0430\u0440\u0115\u043F\u0435 \u0445\u044C\u0430\u043B\u0445\u0430\u0440\u0430 \u0445\u044C\u0430\u043B\u0445\u0430\u0440\u0447\u0443 \u0445\u044C\u043E\u043B\u0430\u0445\u044C \u0445\u044C\u043E\u043B\u0430\u0448 \u0445\u044C\u043E\u0441\u0442\u0430\u043D \u0445\u044C\u043E\u044C\u043A\u0445\u0443 \u0445\u044C\u0443\u043D \u0445\u04AF\u043D \u0445\u04AF\u0440\u0442\u044D\u043B \u0445\u04D9\u0440\u0431\u0438 \u0446\u0430\u0440 \u0446\u0430\u0440\u0430 \u0446\u0430\u0440\u0441\u0442\u0432\u0430 \u0446\u0430\u0440\u0441\u0442\u0432\u043E \u0446\u0430\u0440\u044F \u0446\u0432\u0435\u0442 \u0446\u0432\u0435\u0442\u0430 \u0446\u0435\u0439 \u0446\u0435\u043B \u0446\u0435\u043B\u0430 \u0446\u0435\u043B\u0438 \u0446\u0435\u043B\u043E\u043C \u0446\u0435\u043B\u044C\u044E \u0446\u0435\u043B\u044F\u0445 \u0446\u0435\u043D\u0442\u0430\u0440 \u0446\u0435\u043D\u0442\u0440 \u0446\u0435\u043D\u0442\u0440\u0430 \u0446\u0435\u043D\u0442\u0440\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430\u043B\u044C\u043D\u043E\u0439 \u0446\u0435\u043D\u0442\u0440\u0435 \u0446\u0435\u043D\u0442\u0440\u043E\u043C \u0446\u0435\u043D\u0442\u0440\u0443 \u0446\u0435\u043D\u0442\u0440\u0456 \u0446\u0435\u043D\u0442\u044A\u0440 \u0446\u0435\u0440\u043A\u0432\u0430 \u0446\u0435\u0440\u043A\u0432\u0438 \u0446\u0435\u0440\u043A\u043E\u0432\u044C \u0446\u0438\u043A\u043B \u0446\u0438\u043A\u043B\u043E\u043D\u0430\u0448\u0446\u0430 \u0446\u0438\u043C \u0446\u0438\u0445 \u0446\u0440\u043A\u0432\u0430 \u0446\u0440\u043A\u0432\u0435 \u0446\u0443\u044C\u043D\u0430\u043D \u0446\u0445\u044C\u0430\u0431\u043E\u0441\u0441\u0430 \u0446\u0445\u044C\u0430\u044C\u043D\u0430 \u0446\u044A\u0440\u043A\u0432\u0430 \u0446\u044A\u0440\u043A\u0432\u0430\u0442\u0430 \u0446\u044C\u043E\u0433\u043E \u0446\u044C\u043E\u043C\u0443 \u0446\u044D\u043D\u0442\u0440 \u0446\u044D\u0440\u0433\u0438\u0439\u043D \u0446\u0456\u0439 \u0446\u0456\u0454\u0457 \u0447\u0430\u043A \u0447\u0430\u043A\u043B\u044B \u0447\u0430\u043B \u0447\u0430\u043B\u0430\u0432\u0435\u043A \u0447\u0430\u0440\u0431\u0430\u0447\u044B\u043B\u044B\u043A \u0447\u0430\u0441 \u0447\u0430\u0441\u0430 \u0447\u0430\u0441\u0430\u043C \u0447\u0430\u0441\u0438 \u0447\u0430\u0441\u043E\u0432 \u0447\u0430\u0441\u043E\u043C \u0447\u0430\u0441\u0442 \u0447\u0430\u0441\u0442\u0435\u0439 \u0447\u0430\u0441\u0442\u0438 \u0447\u0430\u0441\u0442\u0438\u043D \u0447\u0430\u0441\u0442\u0438\u043D\u0430 \u0447\u0430\u0441\u0442\u0438\u043D\u0438 \u0447\u0430\u0441\u0442\u0438\u043D\u043E\u044E \u0447\u0430\u0441\u0442\u0438\u043D\u0443 \u0447\u0430\u0441\u0442\u0438\u043D\u0456 \u0447\u0430\u0441\u0442\u0438\u0447\u043D\u043E \u0447\u0430\u0441\u0442\u043A\u0430 \u0447\u0430\u0441\u0442\u043A\u043E\u0432\u043E \u0447\u0430\u0441\u0442\u043D\u043E\u0441\u0442\u0438 \u0447\u0430\u0441\u0442\u043E \u0447\u0430\u0441\u0442\u0446\u044B \u0447\u0430\u0441\u0442\u044C \u0447\u0430\u0441\u0442\u044C\u044E \u0447\u0430\u0441\u0443 \u0447\u0430\u0441\u044B \u0447\u0430\u0441\u0456\u0432 \u0447\u0430\u0449\u0435 \u0447\u0435\u0433\u0430 \u0447\u0435\u0433\u043E \u0447\u0435\u0439\u0438\u043D \u0447\u0435\u0439\u0438\u043D\u043A\u0438 \u0447\u0435\u043A\u0445\u0431\u043E\u043B\u0443\u0448 \u0447\u0435\u043B \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u043E\u043C \u0447\u0435\u043C \u0447\u0435\u043C\u043F\u0438\u043E\u043D \u0447\u0435\u043C\u043F\u0438\u043E\u043D\u0430 \u0447\u0435\u043C\u043F\u0438\u043E\u043D\u0430\u0442 \u0447\u0435\u043C\u043F\u0438\u043E\u043D\u0430\u0442\u0430 \u0447\u0435\u043C\u043F\u0438\u043E\u043D\u0430\u0442\u0435 \u0447\u0435\u043C\u043F\u0438\u043E\u043D\u043E\u0432 \u0447\u0435\u043C\u043F\u0438\u043E\u043D\u043E\u043C \u0447\u0435\u043C\u043F\u0438\u043E\u043D\u044B \u0447\u0435\u043C\u043F\u0456\u043E\u043D \u0447\u0435\u043C\u043F\u0456\u043E\u043D\u0430\u0442\u0443 \u0447\u0435\u043C\u043F\u0456\u043E\u043D\u0430\u0442\u0456 \u0447\u0435\u043C\u0443 \u0447\u0435\u0440\u0432\u043D\u044F \u0447\u0435\u0440\u0432\u043D\u0456 \u0447\u0435\u0440\u0433\u0443 \u0447\u0435\u0440\u0435\u0437 \u0447\u0435\u0441\u0442\u043E \u0447\u0435\u0441\u0442\u043E\u0442\u0430 \u0447\u0435\u0441\u0442\u044C \u0447\u0435\u0442\u0438\u0440\u0438 \u0447\u0435\u0442\u044B\u0440\u0435 \u0447\u0435\u0442\u044B\u0440\u0451\u0445 \u0447\u0435\u0448 \u0447\u0438\u043D \u0447\u0438\u043D\u0435 \u0447\u0438\u043D\u0438 \u0447\u0438\u043D\u043E\u043C \u0447\u0438\u0441\u0435\u043B \u0447\u0438\u0441\u043B\u0430 \u0447\u0438\u0441\u043B\u0435 \u0447\u0438\u0441\u043B\u0435\u043D\u043D\u043E\u0441\u0442\u0438 \u0447\u0438\u0441\u043B\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0447\u0438\u0441\u043B\u0438\u043B\u043E\u0441\u044C \u0447\u0438\u0441\u043B\u043E \u0447\u0438\u0441\u043B\u0456 \u0447\u0438\u0441\u0442\u043E \u0447\u0438\u0458\u0430 \u0447\u0438\u0458\u0430\u0448\u0442\u043E \u0447\u0438\u0458\u0438 \u0447\u043A\u044A\u043E\u0440 \u0447\u043B\u0430\u043D \u0447\u043B\u0430\u043D\u043E\u0432\u0430 \u0447\u043B\u0435\u043D \u0447\u043B\u0435\u043D\u0430 \u0447\u043B\u0435\u043D\u0430\u043C\u0438 \u0447\u043B\u0435\u043D\u043E\u0432 \u0447\u043B\u0435\u043D\u043E\u043C \u0447\u043B\u0435\u043D\u044B \u0447\u043B\u0435\u043D\u0456\u0432 \u0447\u043E\u0432\u0435\u043A \u0447\u043E\u0432\u0435\u043A\u0430 \u0447\u043E\u0433\u043E \u0447\u043E\u043B\u043E\u0432\u0456\u043A \u0447\u043E\u043B\u043E\u0432\u0456\u043A\u0438 \u0447\u043E\u043B\u043E\u0432\u0456\u043A\u0456\u0432 \u0447\u043E\u043B\u0456 \u0447\u043E\u0442\u0438\u0440\u0438 \u0447\u043E\u0442\u0438\u0440\u044C\u043E\u0445 \u0447\u043E\u04A3 \u0447\u0440\u0435\u0437 \u0447\u0442\u043E \u0447\u0442\u043E\u0431\u044B \u0447\u0443\u0440\u0430 \u0447\u044B\u0433\u0430\u043D\u0430\u0433\u044B\u043D\u043D\u0430\u043D \u0447\u044B\u0433\u0430\u0440\u044B\u043B\u044B\u0448\u044B \u0447\u044B\u043A\u043A\u0430\u043D \u0447\u044B\u043C \u0447\u044B\u043D\u0430\u043C \u0447\u044D\u0440\u0432\u0435\u043D\u044F \u0448\u0430\u0430\u0440\u043B\u0430\u0440\u044B\u043D\u044B\u043D \u0448\u0430\u0430\u0440\u044B \u0448\u0430\u043C\u0430\u0441\u044B \u0448\u0430\u043C\u0430\u0441\u044B\u043D\u0434\u0430 \u0448\u0430\u043C\u043F\u0438\u043E\u043D \u0448\u0430\u0440 \u0448\u0430\u0440\u0430\u0445\u044C \u0448\u0430\u04B3\u0440\u0438 \u0448\u0432\u0435\u0434 \u0448\u0432\u0438\u0434\u043A\u043E \u0448\u0432\u0438\u0434\u043A\u0456\u0441\u0442\u044C \u0448\u0435\u043B\u043E\u043D\u0430\u0448 \u0448\u0435\u043D \u0448\u0435\u0440\u0430\u043D \u0448\u0435\u0440\u0430\u0448\u043A\u0430\u0445\u044C \u0448\u0435\u0441\u0442 \u0448\u0435\u0441\u0442\u0438 \u0448\u0435\u0441\u0442\u044C \u0448\u0438\u0439\u043B\u0430 \u0448\u0438\u0439\u043B\u0430\u0447\u0443 \u0448\u0438\u043B\u0430 \u0448\u0438\u0440\u0438\u043D\u0430 \u0448\u0438\u0440\u043E\u043A\u043E \u0448\u0438\u0444\u0440\u0443 \u0448\u043A\u043E\u043B \u0448\u043A\u043E\u043B\u0430 \u0448\u043A\u043E\u043B\u0430\u0445 \u0448\u043A\u043E\u043B\u0435 \u0448\u043A\u043E\u043B\u0438 \u0448\u043A\u043E\u043B\u0443 \u0448\u043A\u043E\u043B\u044B \u0448\u043A\u043E\u043B\u0456 \u0448\u043B\u044F\u0445 \u0448\u043B\u044F\u0445\u043E\u043C \u0448\u043B\u044F\u0445\u0443 \u0448\u043E\u0441\u0441\u0435 \u0448\u043E\u0443 \u0448\u043E\u049B\u0436\u04B1\u043B\u0434\u044B\u0437\u044B\u043D\u0434\u0430 \u0448\u0442\u0430\u0431 \u0448\u0442\u0430\u0431\u0430 \u0448\u0442\u0430\u0431\u0443 \u0448\u0442\u0430\u0442 \u0448\u0442\u0430\u0442\u0430 \u0448\u0442\u0430\u0442\u0443 \u0448\u0442\u0430\u0442\u044B\u043D\u044B\u043D \u0448\u0442\u0430\u0442\u044B\u043D\u044B\u04A3 \u0448\u0442\u043E \u0448\u0443\u0434 \u0448\u0443\u0434\u0430 \u0448\u0443\u0434\u0430\u0430\u0441\u0442 \u0448\u0443\u043B \u0448\u0443\u043B\u0430\u0439 \u0448\u044B\u0432 \u0448\u044B\u0493\u0430\u0440\u0443 \u0448\u044B\u0493\u0430\u0440\u044B\u043B\u0443\u044B \u0448\u044B\u049B\u049B\u0430\u043D \u0448\u04D9\u04BB\u04D9\u0440 \u0449\u0430\u0442\u0430 \u0449\u043E\u0431 \u0449\u043E\u0434\u043E \u044D\u0432\u043B\u0430 \u044D\u043A\u0437 \u044D\u043A\u0438 \u044D\u043A\u0438\u043F\u0430\u0436\u0430 \u044D\u043A\u043E\u043B\u043E\u0433\u0438 \u044D\u043A\u043E\u043B\u043E\u0433\u0438\u044F \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0430 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0430\u043B\u044B\u049B \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0438 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u044D\u043A\u0441\u043F\u0435\u0434\u0438\u0446\u0438\u0438 \u044D\u043B\u0435 \u044D\u043B\u0435\u043A\u0442\u0440 \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u0434\u044B \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u044B\u0439 \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u044D\u043C\u0435\u0441 \u044D\u043C\u0438 \u044D\u043D\u0435\u0440\u0433\u0438\u0438 \u044D\u043D\u0446\u0438\u043A\u043B\u043E\u043F\u0435\u0434\u0438\u0438 \u044D\u043D\u0446\u0438\u043A\u043B\u043E\u043F\u0435\u0434\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u044D\u043D\u0446\u0438\u043A\u043B\u043E\u043F\u0435\u0434\u0438\u044F \u044D\u043D\u0446\u0438\u043A\u043B\u043E\u043F\u0435\u0434\u0438\u044F\u0441\u044B \u044D\u043D\u0446\u044B\u043A\u043B\u0430\u043F\u0435\u0434\u044B\u044F \u044D\u043D\u044D \u044D\u043F\u0438\u0437\u043E\u0434 \u044D\u043F\u043E\u0445\u0438 \u044D\u043F\u043E\u0445\u0443 \u044D\u0441\u0432\u044D\u043B \u044D\u0441\u043A\u0435 \u044D\u0442\u0430 \u044D\u0442\u0430\u043F \u044D\u0442\u0430\u043F\u0435 \u044D\u0442\u0438 \u044D\u0442\u0438\u043C \u044D\u0442\u0438\u0445 \u044D\u0442\u043E \u044D\u0442\u043E\u0433\u043E \u044D\u0442\u043E\u0439 \u044D\u0442\u043E\u043C \u044D\u0442\u043E\u043C\u0443 \u044D\u0442\u043E\u0442 \u044D\u0442\u0443 \u044D\u0448\u043B\u04D9\u0439 \u044E\u0433\u0435 \u044E\u0433\u043E \u044E\u0433\u0443 \u044E\u0436\u043D\u043E\u0439 \u044E\u043A\u043A\u044A\u0435\u0440\u0430 \u044E\u043A\u043A\u044A\u0435\u0440\u0430\u0447\u0443 \u044E\u043A\u043A\u044A\u0435\u0445\u044C \u044E\u043A\u044A\u0430 \u044E\u043A\u044A\u0430\u0440\u0430 \u044E\u043B\u0438 \u044E\u043D\u0438 \u044E\u0445\u0430\u043D\u0448\u044B\u0432 \u044E\u0445\u0430\u043D\u0448\u044B\u0432\u0103\u043D \u044E\u0445\u0430\u043D\u0448\u044B\u0432\u0430 \u044E\u0445\u0430\u0442\u044C \u044E\u0445\u0441\u0430 \u044E\u044C\u0440\u0442\u0430\u043D \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u044F\u0432\u043B\u044F\u043B\u0441\u044F \u044F\u0432\u043B\u044F\u044E\u0442\u0441\u044F \u044F\u0433\u043E \u044F\u0434\u0440\u0430 \u044F\u0437\u0430\u043D\u0456 \u044F\u0437\u043A\u0438 \u044F\u0437\u043A\u0443 \u044F\u0437\u043E\u043A \u044F\u0437\u044B\u043A \u044F\u0437\u044B\u043A\u0430 \u044F\u0437\u044B\u043A\u0430\u0445 \u044F\u0437\u044B\u043A\u0435 \u044F\u0437\u044B\u043A\u0438 \u044F\u0437\u044B\u043A\u043E\u0432 \u044F\u043A\u0430 \u044F\u043A\u0430\u0441\u0446\u0456 \u044F\u043A\u0430\u044F \u044F\u043A\u0435 \u044F\u043A\u0438 \u044F\u043A\u0438\u0439 \u044F\u043A\u0438\u043C \u044F\u043A\u0438\u043C\u0438 \u044F\u043A\u0438\u0445 \u044F\u043A\u043E\u0433\u0430 \u044F\u043A\u043E\u0433\u043E \u044F\u043A\u043E\u0435 \u044F\u043A\u043E\u0439 \u044F\u043A\u043E\u043C\u0443 \u044F\u043A\u043E\u0441\u0442\u0456 \u044F\u043A\u043E\u044E \u044F\u043A\u043E\u0457 \u044F\u043A\u0443 \u044F\u043A\u0449\u043E \u044F\u043A\u044B\u043D \u044F\u043A\u0456 \u044F\u043A\u0456\u0439 \u044F\u043A\u0456\u043C \u044F\u043A\u0456\u0445 \u044F\u043A\u0456\u044F \u044F\u043B\u0442\u0430\u0448 \u044F\u043C\u0443 \u044F\u043D\u0430 \u044F\u043D\u0432\u0430\u0440\u0435 \u044F\u043D\u0432\u0430\u0440\u0435\u0445\u044C \u044F\u043D\u0432\u0430\u0440\u044C \u044F\u043D\u0432\u0430\u0440\u044F \u044F\u043D\u0443\u0430\u0440\u0438 \u044F\u043D\u044B \u044F\u0440\u0430 \u044F\u0440\u044B\u043D\u0430 \u044F\u0440\u044B\u043D\u043D\u0430\u043D \u044F\u0441\u043D\u043E \u044F\u0442\u0438 \u044F\u0442\u043D\u0438\u043A \u044F\u0442\u044C \u044F\u0442\u0456 \u044F\u0448\u0447\u044D \u044F\u045E\u043B\u044F\u0435\u0446\u0446\u0430 \u044F\u045E\u043B\u044F\u044E\u0446\u0446\u0430 \u044F\u0493\u043D\u0438 \u044F\u04A3\u044B \u0451\u0441\u0446\u044C \u0454\u0432\u0440\u043E \u0454\u0434\u043D\u0430\u043D\u043D\u044F \u0454\u043A\u0442 \u0454\u043A\u0442\u0430 \u0454\u043A\u0442\u0438 \u0454\u043A\u0442\u043E\u043C \u0454\u043A\u0442\u0456\u0432 \u0454\u0440\u0430 \u0454\u0440\u0438 \u0454\u0440\u0443 \u0455\u0432\u0435\u0437\u0434\u0438 \u0456\u0433\u043E\u0440 \u0456\u0433\u0440\u0430\u0445 \u0456\u043C\u0435\u043D\u0456 \u0456\u043C\u043F\u0435\u0440\u0430\u0442\u043E\u0440\u0430 \u0456\u043C\u043F\u0435\u0440\u044B\u0456 \u0456\u043C\u043F\u0435\u0440\u0456\u0457 \u0456\u043C\u044F \u0456\u043D\u043E\u0434\u0456 \u0456\u043D\u0441\u0442\u0438\u0442\u0443\u0442 \u0456\u043D\u0441\u0442\u0438\u0442\u0443\u0442\u0443 \u0456\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0456\u044F \u0456\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0456\u0457 \u0456\u043D\u0448 \u0456\u043D\u0448\u0438\u043C\u0438 \u0456\u043D\u0448\u0438\u0445 \u0456\u043D\u0448\u043E\u0433\u043E \u0456\u043D\u0448\u044B\u0445 \u0456\u043D\u0448\u044B\u044F \u0456\u043D\u0448\u0456 \u0456\u0440\u0456 \u0456\u0441\u043D\u0443\u0432\u0430\u043D\u043D\u044F \u0456\u0441\u043D\u0443\u0454 \u0456\u0441\u043F \u0456\u0441\u0442\u043E\u0440\u0456\u044E \u0456\u0441\u0442\u043E\u0440\u0456\u044F \u0456\u0441\u0442\u043E\u0440\u0456\u0457 \u0456\u0442\u0430\u043B \u0456\u0448\u043A\u0456 \u0456\u0448\u0456\u043D\u0434\u0435 \u0458\u0430\u0437\u0438\u043A \u0458\u0430\u0437\u0438\u0446\u0438 \u0458\u0430\u043D\u0443\u0430\u0440\u0430 \u0458\u0430\u043D\u0443\u0430\u0440\u0438 \u0458\u0435\u0434\u0430\u043D \u0458\u0435\u0434\u0438\u043D\u0438\u0446\u0430 \u0458\u0435\u0434\u043D\u0430 \u0458\u0435\u0434\u043D\u0435 \u0458\u0435\u0434\u043D\u043E \u0458\u0435\u0434\u043D\u043E\u0433 \u0458\u0435\u0434\u043D\u043E\u043C \u0458\u0435\u0434\u043D\u0443 \u0458\u0435\u0437\u0438\u043A \u0458\u0435\u0437\u0438\u043A\u0430 \u0458\u0435\u0437\u0438\u043A\u0443 \u0458\u0435\u0440 \u0458\u043E\u0448 \u0458\u043E\u0458 \u0458\u0443\u043B\u0430 \u0458\u0443\u043B\u0438 \u0458\u0443\u043D\u0430 \u0458\u0443\u043D\u0438 \u0459\u0443\u0434\u0438 \u045A\u0435\u0433\u0430 \u045A\u0435\u0433\u043E\u0432 \u045A\u0435\u0433\u043E\u0432\u0430 \u045A\u0435\u0433\u043E\u0432\u0435 \u045A\u0435\u0433\u043E\u0432\u043E\u0433 \u045A\u0435\u043C \u045A\u0435\u043C\u0430\u0447\u043A\u043E\u0458 \u045A\u0435\u043C\u0443 \u045A\u0438\u043C\u0430 \u045A\u0438\u0445 \u0493\u0430\u043D\u0430 \u0493\u0430\u0440\u044B\u0448 \u0493\u0430\u0441\u044B\u0440\u0434\u044B\u04A3 \u0493\u044B\u043B\u044B\u043C \u0493\u044B\u043B\u044B\u043C\u0434\u0430\u0440\u044B\u043D\u044B\u04A3 \u0493\u044B\u043B\u044B\u043C\u0438 \u0493\u044B\u043D\u0430 \u0497\u0430\u043D\u0438\u0441\u04D9\u043F \u0497\u04D9\u0439 \u0499\u0443\u0440 \u049B\u0430\u0437\u0430\u049B \u049B\u0430\u0437\u0430\u049B\u0448\u0430 \u049B\u0430\u0437\u0456\u0440\u0433\u0456 \u049B\u0430\u0439\u0442\u0430 \u049B\u0430\u043B\u0430 \u049B\u0430\u043B\u0430\u043B\u0430\u0440\u044B \u049B\u0430\u043B\u0430\u043B\u044B\u049B \u049B\u0430\u043B\u0430\u0441\u044B \u049B\u0430\u043B\u0430\u0441\u044B\u043D\u0434\u0430 \u049B\u0430\u043C\u0442\u0430\u043C\u0430\u0441\u044B\u0437 \u049B\u0430\u0440\u0430 \u049B\u0430\u0440\u0430\u0439 \u049B\u0430\u0440\u0430\u043B\u0493\u0430\u043D \u049B\u0430\u0440\u0430\u0441\u0442\u044B \u049B\u0430\u0440\u0430\u0448\u0430 \u049B\u0430\u0440\u043E\u0440 \u049B\u0430\u0440\u0441\u044B \u049B\u0430\u0442\u0430\u0440 \u049B\u0430\u0442\u044B\u0441\u0442\u044B \u049B\u0430\u0448\u044B\u049B\u0442\u044B\u049B\u0442\u0430 \u049B\u043E\u043B \u049B\u043E\u043B\u0434\u0430\u043D\u044B\u043B\u0430\u0434\u044B \u049B\u043E\u0441\u044B\u043B\u0443 \u049B\u043E\u0441\u044B\u043C\u0448\u0430 \u049B\u044B\u0437\u043C\u0435\u0442 \u049B\u04B1\u0439\u044B\u043B\u044B\u0441\u044B\u043D\u0430 \u049B\u04B1\u0440\u0430\u0434\u044B \u049B\u04B1\u0440\u0430\u0439\u0434\u044B \u049B\u04B1\u0440\u0430\u043C\u0434\u0430\u0441 \u049B\u04B1\u0440\u0430\u043C\u044B \u049B\u04B1\u0440\u0430\u043C\u044B\u043D\u0430 \u049B\u04B1\u0440\u0430\u043C\u044B\u043D\u0434\u0430 \u049B\u04B1\u0440\u044B\u043B\u044B\u0441\u0442\u0430\u0440\u0434\u044B \u049B\u04B1\u0440\u044B\u043B\u0493\u0430\u043D \u04A1\u0430\u043B\u0430 \u04A1\u0430\u043B\u0430\u04BB\u044B \u04A1\u0430\u0440\u0430\u0442\u0430 \u04A1\u043E\u0440\u043E\u043B\u043C\u0430\u043B\u0430\u0440 \u04A1\u0443\u0448\u044B\u043B\u0430 \u04A1\u0443\u0448\u044B\u043B\u0434\u044B\u04A1\u0442\u0430\u0440\u044B \u04A1\u0443\u0448\u044B\u043B\u0493\u0430\u043D \u04A1\u0443\u0448\u044B\u043B\u0493\u0430\u043D\u0493\u0430 \u04AF\u0435\u0434 \u04AF\u0435\u0438\u0439\u043D \u04AF\u0439\u043B \u04AF\u043B\u043A\u0435\u043D \u04AF\u0442\u04D9 \u04AF\u0447\u04AF\u043D \u04AF\u0448\u0456\u043D \u04AF\u0499\u04D9\u0433\u0435 \u04AF\u0499\u04D9\u0433\u0435\u043D\u04D9 \u04B1\u0437\u044B\u043D\u0434\u044B\u0493\u044B \u04B1\u043B\u0442\u0442\u044B\u049B \u04B3\u0430\u0432\u043E\u0433\u0430\u0440\u0434 \u04B3\u0430\u0432\u043E\u0433\u0430\u0440\u0434\u0438 \u04B3\u0430\u0439\u0430\u0442\u0438 \u04B3\u0430\u043C\u0430\u0433\u043E\u043D\u0430 \u04BB\u0430\u0432\u0430 \u04BB\u0430\u043D\u044B \u04BB\u0443\u043B \u04BB\u0443\u04A3 \u04BB\u044B\u0443 \u04BB\u04D9\u043C \u04D9\u043A\u0456\u043C\u0448\u0456\u043B\u0456\u043A \u04D9\u043B\u0435\u0443\u043C\u0435\u0442\u0442\u0456\u043A \u04D9\u0440\u0456 \u04D9\u0441\u043A\u0435\u0440\u0438 \u04D9\u0499\u0435\u0440\u043B\u04D9\u043D\u0433\u04D9\u043D \u04E9\u0437\u0433\u0435 \u04E9\u0437\u0435\u043D \u04E9\u0437\u0435\u043D\u043D\u0456\u04A3 \u04E9\u0437\u0435\u043D\u0456 \u04E9\u0437\u0435\u043D\u0456\u043D\u0456\u04A3 \u04E9\u0437\u0456 \u04E9\u0437\u0456\u043D\u0456\u04A3 \u04E9\u0439\u0440\u04D9\u043D\u0435\u04AF \u04E9\u0439\u0440\u04D9\u043D\u04AF \u04E9\u043B\u0435\u0448\u0435 \u04E9\u043B\u043A\u04D9\u0441\u0435 \u04E9\u043B\u043A\u04D9\u0441\u0435\u043D\u0435\u04A3 \u04E9\u043B\u043A\u04D9\u04BB\u0435 \u04E9\u043B\u04E9\u0448\u04E9 \u04E9\u043C\u0456\u0440 \u04E9\u043D\u0434\u04E9\u0440 \u04E9\u0441\u04E9\u043D \u04E9\u0442\u0435 \u04E9\u0442\u0435\u0434\u0456 \u04E9\u0442\u043A\u0435\u043D \u04E9\u0442\u04E9 \u04E9\u0442\u04E9\u0442 \u04E9\u0447\u0435\u043D \u04E9\u04A3\u0456\u0440\u0456\u043D\u0435 \u04E9\u04AB\u0442\u04D9\u0440\u04D9\u043A \u04E9\u04E9\u0440\u0438\u0439\u043D \u0561\u0566\u0563\u0561\u0575\u056B\u0576 \u0561\u056F\u0561\u0576 \u0561\u056F\u0578\u0582\u0574\u0562\u056B \u0561\u056F\u057F\u056B\u057E \u0561\u0574\u0562\u0578\u0572\u057B \u0561\u0574\u0562\u0578\u0572\u057B\u0561\u056F\u0561\u0576 \u0561\u0574\u0565\u0576 \u0561\u0575\u0564 \u0561\u0575\u056A\u0574 \u0561\u0575\u056C \u0561\u0575\u056C\u0576 \u0561\u0575\u0576 \u0561\u0575\u057D \u0561\u0576\u0563\u0561\u0574 \u0561\u0576\u0563\u056C \u0561\u0576\u0563\u056C\u0565\u0580\u0565\u0576 \u0561\u0576\u0564\u0561\u0574 \u0561\u0576\u056F\u0575\u0578\u0582\u0576 \u0561\u0576\u0571 \u0561\u0576\u0578\u0582\u0576\u0568 \u0561\u0576\u0578\u0582\u0576\u0576\u0565\u0580\u056B \u0561\u0576\u0578\u0582\u0576\u0578\u057E \u0561\u0576\u057E\u0561\u0576 \u0561\u0576\u0581 \u0561\u0577\u056D\u0561\u057F\u0565\u056C \u0561\u0577\u056D\u0561\u057F\u0578\u0582\u0574 \u0561\u0577\u056D\u0561\u057F\u0578\u0582\u0576\u0561\u056F \u0561\u0577\u056D\u0561\u0580\u0570\u056B \u0561\u057A\u0561 \u0561\u057A\u0580\u056B\u056C\u056B \u0561\u057C\u0561\u0576\u0571\u056B\u0576 \u0561\u057C\u0561\u0576\u0581 \u0561\u057C\u0561\u057B \u0561\u057C\u0561\u057B\u056B\u0576 \u0561\u057C\u0561\u057E\u0565\u056C \u0561\u057C\u0561\u057E\u0565\u056C\u0561\u0563\u0578\u0582\u0575\u0576\u0568 \u0561\u057D\u057F\u0565\u0580\u0578\u056B\u0564 \u0561\u057D\u057F\u0565\u0580\u0578\u056B\u0564\u0568 \u0561\u057D\u057F\u0565\u0580\u0578\u056B\u0564\u0576\u0565\u0580\u056B \u0561\u057D\u057F\u056B\u0573\u0561\u0576 \u0561\u057E\u0561\u0580\u057F\u0565\u056C \u0561\u057E\u0565\u056C\u056B \u0561\u0580\u0561\u0563\u0578\u0582\u0569\u0575\u0561\u0574\u0562 \u0561\u0580\u0562\u0561\u0576\u0575\u0561\u056F\u0561\u0575\u056B\u0576 \u0561\u0580\u0564\u0565\u0576 \u0561\u0580\u0564\u0575\u0578\u0582\u0576\u0584\u0576\u0565\u0580\u0568 \u0561\u0580\u0564\u0575\u0578\u0582\u0576\u0584\u0578\u0582\u0574 \u0561\u0580\u057E\u0565\u057D\u057F\u056B \u0561\u0580\u057F\u0561\u0584\u056B\u0576 \u0561\u0580\u0587\u0565\u056C\u0584 \u0561\u0580\u0587\u0574\u0578\u0582\u057F\u0584 \u0561\u0583\u056B\u0576 \u0562\u0561\u0566\u0574\u0561\u0569\u056B\u057E \u0562\u0561\u056A\u0561\u0576\u0574\u0561\u0576 \u0562\u0561\u056A\u0561\u0576\u0574\u0578\u0582\u0576\u0584\u056B \u0562\u0561\u0575\u0581 \u0562\u0561\u057C\u0561\u0580\u0561\u0576 \u0562\u0561\u0580\u0571\u0580 \u0562\u0561\u0581 \u0562\u0576\u0561\u056F\u0561\u057E\u0561\u0575\u0580\u0565\u0580 \u0562\u0576\u0561\u056F\u0561\u057E\u0561\u0575\u0580\u0565\u0580\u056B \u0562\u0576\u0561\u056F\u0561\u057E\u0561\u0575\u0580\u056B \u0562\u0576\u0561\u056F\u056B\u0579 \u0562\u0576\u0561\u056F\u0579\u0578\u0582\u0569\u0575\u0561\u0576 \u0562\u0576\u0561\u056F\u0579\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0568 \u0562\u0576\u0561\u056F\u057E\u0578\u0582\u0574 \u0562\u0578\u056C\u0578\u0580 \u0563\u0561\u056C\u056B\u057D \u0563\u0561\u057E\u0561\u057C\u056B \u0563\u0561\u057E\u0561\u057C\u0578\u0582\u0574 \u0563\u0565\u057F \u0563\u0565\u057F\u056B \u0563\u0565\u0580\u0574 \u0563\u056B\u057F\u0561\u056F\u0561\u0576 \u0563\u056C\u056D\u0561\u057E\u0578\u0580 \u0563\u0575\u0578\u0582\u0572 \u0563\u0575\u0578\u0582\u0572\u0578\u0582\u0574 \u0563\u0578\u057F\u056B\u0576\u0565\u0580\u0568 \u0563\u0578\u057F\u0578\u0582\u0574 \u0563\u0578\u0580\u056E\u0561\u056F\u0561\u056C\u0578\u0582\u0569\u0575\u0561\u0576 \u0563\u0578\u0580\u056E\u056B\u0579 \u0563\u0578\u0580\u056E\u0578\u0582\u0574 \u0563\u057F\u0576\u057E\u0578\u0572 \u0563\u057F\u0576\u057E\u0578\u0582\u0574 \u0563\u0580\u0561\u0576\u0581\u057E\u0561\u056E \u0563\u0580\u0565\u056C \u0563\u0580\u0578\u0572 \u0564\u0561\u057C\u0576\u0578\u0582\u0574 \u0564\u0561\u057D\u0561\u056F\u0561\u0580\u0563\u056B\u0579 \u0564\u0561\u057D\u0565\u0580 \u0564\u0561\u0580\u056B \u0564\u0561\u0580\u0571\u0561\u057E \u0564\u0561\u0580\u0571\u0565\u056C \u0564\u0561\u0580\u0578\u0582\u0574 \u0564\u0565\u056F\u057F\u0565\u0574\u0562\u0565\u0580\u056B \u0564\u0565\u0574 \u0564\u0565\u057A\u056B \u0564\u0565\u057A\u0584\u0578\u0582\u0574 \u0564\u0565\u0580\u0561\u057D\u0561\u0576 \u0564\u0565\u0580\u0568 \u0564\u056B\u057F\u0561\u0580\u056F\u0578\u0582\u0574\u0576\u0565\u0580\u0568 \u0564\u0578\u0582\u0580\u057D \u0564\u0580\u0578\u0582\u0569\u0575\u0561\u0574\u0562 \u0565\u0569\u0565 \u0565\u056F\u0565\u056C \u0565\u0572\u0565\u056C \u0565\u0580\u0561\u056A\u0577\u057F\u0561\u056F\u0561\u0576 \u0565\u0580\u0562 \u0565\u0580\u0563\u0568 \u0565\u0580\u0565\u0584 \u0565\u0580\u056F\u0561\u0580 \u0565\u0580\u056F\u0561\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0568 \u0565\u0580\u056F\u0578\u0582 \u0565\u0580\u056F\u0580\u0561\u0575\u056B\u0576 \u0565\u0580\u056F\u0580\u056B \u0565\u0580\u056F\u0580\u0578\u0580\u0564 \u0565\u0580\u0580\u0578\u0580\u0564 \u0566\u0561\u0580\u0563\u0561\u0581\u0574\u0561\u0576 \u0566\u0562\u0561\u0572\u0565\u0581\u0576\u0578\u0582\u0574 \u0567\u056B\u0576 \u0567\u057D\u057F\u0578\u0576\u0565\u0580\u0565\u0576 \u0568\u0576\u0564\u056C\u0561\u0575\u0576\u057E\u0561\u056E \u0568\u0576\u0564\u0570\u0561\u0576\u0578\u0582\u0580 \u0568\u0576\u0569\u0561\u0581\u0584\u0578\u0582\u0574 \u0568\u0576\u057F\u0561\u0576\u056B\u0584\u0576\u0565\u0580 \u0568\u057D\u057F \u0569\u0578\u0582\u0575\u056C \u0569\u057E\u0561\u056F\u0561\u0576 \u0569\u057E\u0561\u056F\u0561\u0576\u0568 \u0569\u057E\u0561\u056F\u0561\u0576\u056B \u0569\u057E\u0561\u056F\u0561\u0576\u056B\u0576 \u0569\u057E\u0561\u056F\u0561\u0576\u056B\u0581 \u0569\u057E\u0561\u056F\u0561\u0576\u0576\u0565\u0580\u056B\u0576 \u0569\u057E\u0578\u0582\u0574 \u056A\u0561\u0574\u0561\u0575\u056B\u0576 \u056A\u0561\u0574\u0561\u0576\u0561\u056F \u056A\u0561\u0574\u0561\u0576\u0561\u056F\u0561\u056F\u056B\u0581 \u056A\u0578\u0572\u0578\u057E\u0561\u056E\u0578\u0582 \u056A\u0578\u0572\u0578\u057E\u0580\u0564\u0561\u056F\u0561\u0576 \u056B\u0576\u0579 \u056B\u0576\u0579\u057A\u0565\u057D \u056B\u0576\u057D\u057F\u056B\u057F\u0578\u0582\u057F \u056B\u0576\u057D\u057F\u056B\u057F\u0578\u0582\u057F\u056B \u056B\u057D\u056F \u056B\u057D\u057A \u056B\u057F\u0561\u056C \u056B\u0580\u0561\u0580 \u056B\u0580\u0565\u0576 \u056B\u0580\u0565\u0576\u0581 \u056C\u0561\u057E \u056C\u0561\u057E\u0561\u0563\u0578\u0582\u0575\u0576 \u056C\u056B\u0576\u0578\u0582\u0574 \u056C\u0578\u0582\u057D\u0561\u0576\u056F\u0561\u0580\u0576\u0565\u0580 \u056D\u0561\u0572\u0578\u0582\u0574 \u056D\u0561\u057E\u0561\u0580\u0561\u056E\u0580\u056B \u056D\u0574\u0562\u0565\u0580 \u056D\u0574\u0562\u056B \u056D\u0578\u0577\u0578\u0580 \u056D\u0578\u0580\u0570\u0580\u0564\u0561\u0575\u056B\u0576 \u056D\u057F\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0568 \u056E\u0561\u057C\u0561\u0575\u0578\u0582\u0569\u0575\u0561\u0576 \u056E\u0576\u057E\u0565\u056C \u056F\u0561\u0566\u0574\u056B \u056F\u0561\u0566\u0574\u0578\u0582\u0574 \u056F\u0561\u0566\u0574\u057E\u0561\u056E \u056F\u0561\u0574 \u056F\u0561\u0575\u0584 \u056F\u0561\u0575\u0584\u0578\u0582\u0574 \u056F\u0561\u0576 \u056F\u0561\u057A\u057E\u0561\u056E \u056F\u0561\u057C\u0578\u0582\u0581\u057E\u0565\u056C \u056F\u0561\u057F\u0561\u0580\u0565\u056C \u056F\u0561\u057F\u0561\u0580\u0578\u0582\u0574 \u056F\u0561\u0580\u0565\u056C\u056B \u056F\u0561\u0580\u0578\u0572 \u056F\u0561\u0580\u0587\u0578\u0580 \u056F\u0565\u0576\u057F\u0580\u0578\u0576\u056B \u056F\u056B\u0576 \u056F\u0575\u0561\u0576\u0584\u056B \u056F\u0578\u0564 \u056F\u0578\u0564\u0568 \u056F\u0578\u0572\u0574\u056B\u0581 \u056F\u0578\u0574\u056B\u057F\u0565\u056B \u056F\u0578\u0574\u0578\u0582\u0576\u0561 \u056F\u0578\u0579\u057E\u0578\u0582\u0574 \u0570\u0561\u0566\u0561\u0580 \u0570\u0561\u0573\u0561\u056D \u0570\u0561\u0574\u0561\u056C\u057D\u0561\u0580\u0561\u0576\u056B \u0570\u0561\u0574\u0561\u056F\u0561\u0580\u0563\u056B \u0570\u0561\u0574\u0561\u0571\u0561\u0575\u0576 \u0570\u0561\u0574\u0561\u0575\u0576\u0584 \u0570\u0561\u0574\u0561\u0575\u0576\u0584\u056B \u0570\u0561\u0574\u0561\u0577\u056D\u0561\u0580\u0570\u0561\u0575\u056B\u0576 \u0570\u0561\u0574\u0561\u057A\u0565\u057F\u0561\u056F\u0561\u0576 \u0570\u0561\u0574\u0561\u057C\u0578\u0582\u057D\u0561\u057D\u057F\u0561\u0576\u0575\u0561\u0576 \u0570\u0561\u0574\u0561\u0580 \u0570\u0561\u0574\u0561\u0580\u057E\u0578\u0582\u0574 \u0570\u0561\u0575 \u0570\u0561\u0575\u0561\u0562\u0576\u0561\u056F \u0570\u0561\u0575\u056F\u0561\u056F\u0561\u0576 \u0570\u0561\u0575\u057F\u0576\u056B \u0570\u0561\u0576\u0564\u0565\u057D \u0570\u0561\u0576\u0564\u056B\u057A\u0578\u0582\u0574 \u0570\u0561\u0576\u0564\u056B\u057D\u0561\u0576\u0578\u0582\u0574 \u0570\u0561\u0576\u0580\u0561\u057A\u0565\u057F\u0578\u0582\u0569\u0575\u0561\u0576 \u0570\u0561\u0577\u057E\u0578\u057E \u0570\u0561\u057D\u0561\u0580\u0561\u056F\u0561\u056F\u0561\u0576 \u0570\u0561\u057E\u0561\u0584\u0561\u056F\u0561\u0576\u056B \u0570\u0561\u057F\u056F\u0561\u057A\u0565\u057D \u0570\u0561\u057F\u0578\u0580\u0578\u057E \u0570\u0561\u057F\u0578\u0582\u056F \u0570\u0561\u0580\u0561\u056F\u056B\u0581 \u0570\u0561\u0580\u0561\u057E \u0570\u0561\u0580\u0569\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0576\u0565\u0580\u0568 \u0570\u0565\u0572\u056B\u0576\u0561\u056F \u0570\u0565\u057C\u0561\u0576\u0578\u0582\u0574 \u0570\u0565\u057C\u0561\u057E\u0578\u0580\u0578\u0582\u0569\u0575\u0561\u0576 \u0570\u0565\u057C\u0561\u057E\u0578\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0568 \u0570\u0565\u057F \u0570\u0565\u057F\u0561\u0563\u0561\u0575\u0578\u0582\u0574 \u0570\u0565\u057F\u0578 \u0570\u056B\u0574\u0576\u0561\u056F\u0561\u0576 \u0570\u056B\u0574\u0576\u0561\u056F\u0561\u0576\u0578\u0582\u0574 \u0570\u056B\u0576 \u0570\u0575\u0578\u0582\u057D\u056B\u057D \u0570\u0578\u056F\u057F\u0565\u0574\u0562\u0565\u0580\u056B \u0570\u0578\u0582\u056C\u056B\u057D\u056B \u0570\u0578\u0582\u0576\u056B\u057D\u056B \u0570\u0578\u0582\u0576\u057E\u0561\u0580\u056B \u0570\u0580\u0561\u057F\u0561\u0580\u0561\u056F\u0578\u0582\u0569\u0575\u0578\u0582\u0576 \u0570\u0580\u0561\u057F\u0561\u0580\u0561\u056F\u0579\u0578\u0582\u0569\u0575\u0578\u0582\u0576 \u0571\u0565\u057C\u0584 \u0574\u0561\u0575\u056B\u057D\u056B \u0574\u0561\u057D\u0568 \u0574\u0561\u057D\u056B\u0576 \u0574\u0561\u057D\u0576\u0561\u056F\u0581\u0565\u056C \u0574\u0561\u057D\u0578\u0582\u0574 \u0574\u0561\u0580\u0564 \u0574\u0561\u0580\u0564\u0561\u0570\u0561\u0574\u0561\u0580\u056B \u0574\u0561\u0580\u0564\u056F\u0561\u0576\u0581 \u0574\u0561\u0580\u0564\u0578\u0582 \u0574\u0561\u0580\u0566\u056B \u0574\u0561\u0580\u0566\u0578\u0582\u0574 \u0574\u0561\u0580\u0574\u056B\u0576\u0576\u0565\u0580\u056B \u0574\u0561\u0580\u057F\u056B \u0574\u0565\u056E \u0574\u0565\u056F \u0574\u0565\u056F\u0568 \u0574\u0565\u057B \u0574\u0567\u057B \u0574\u056B\u0561\u0575\u0576 \u0574\u056B\u0561\u057D\u056B\u0576 \u0574\u056B\u056C\u056B\u0578\u0576 \u0574\u056B\u0576\u0579\u0587 \u0574\u056B\u057B\u0561\u0566\u0563\u0561\u0575\u056B\u0576 \u0574\u056B\u057B\u056B\u0576 \u0574\u056B\u057B\u056B\u0576\u0578\u0582\u0574 \u0574\u056B\u057B\u0578\u0581\u0578\u057E \u0574\u056B\u057B\u0587 \u0574\u0575\u0578\u0582\u057D \u0574\u0577\u0561\u056F\u0578\u0582\u0575\u0569\u056B \u0574\u0578\u056C\u0578\u0580\u0561\u056F\u0576\u0565\u0580\u056B \u0574\u0578\u057F \u0574\u0578\u057F\u0565\u0576\u0578\u0582\u0574 \u0574\u057F\u0576\u0578\u0582\u0574 \u0574\u0580\u0581\u0561\u0576\u0561\u056F \u0576\u0561\u0565\u0582 \u0576\u0561\u056D\u0561\u0563\u0561\u0570 \u0576\u0561\u056D\u056F\u056B\u0576 \u0576\u0561\u0570\u0561\u0576\u0563\u056B \u0576\u0561\u0587 \u0576\u0565\u0580\u056F\u0561\u0575\u0561\u0581\u0576\u0578\u0582\u0574 \u0576\u0565\u0580\u0584\u056B\u0576 \u0576\u056F\u0561\u057F\u0574\u0561\u0574\u0562 \u0576\u0574\u0561\u0576 \u0576\u0578\u0575\u0565\u0574\u0562\u0565\u0580\u056B \u0576\u0578\u0580 \u0576\u0578\u0582\u0575\u0576 \u0576\u0578\u0582\u0575\u0576\u057A\u0565\u057D \u0576\u057A\u0561\u057F\u0561\u056F\u0578\u057E \u0576\u057E\u056B\u0580\u057E\u0561\u056E \u0576\u0580\u0561 \u0576\u0580\u0561\u0576 \u0576\u0580\u0561\u0576\u0581 \u0576\u0580\u0561\u0576\u0584 \u0577\u0561\u057F \u0577\u0561\u0580\u056A\u057E\u0565\u056C\u0578\u057E \u0577\u0561\u0580\u0584 \u0577\u0576\u0578\u0580\u0570\u056B\u057E \u0577\u0578\u0582\u0580\u057B \u0577\u057F\u0565\u0574\u0561\u0580\u0561\u0576 \u0577\u0580\u057B\u0561\u0576 \u0577\u0580\u057B\u0561\u0576\u056B \u0577\u0580\u057B\u0561\u0576\u056B\u0576 \u0577\u0580\u057B\u0561\u0576\u0576\u0565\u0580\u056B \u0577\u0580\u057B\u0561\u0576\u0578\u0582\u0574 \u0578\u0580\u0568 \u0578\u0580\u056B \u0578\u0580\u0576 \u0578\u0580\u0578\u0576\u0581 \u0578\u0580\u0578\u0576\u0581\u056B\u0581 \u0578\u0580\u0578\u0576\u0584 \u0578\u0580\u0578\u0577 \u0578\u0580\u0578\u0577\u0578\u0582\u0574 \u0578\u0580\u0578\u0582\u0574 \u0578\u0580\u057A\u0565\u057D \u0578\u0580\u057A\u0565\u057D\u0566\u056B \u0578\u0580\u057F\u0565\u0572 \u0578\u0582\u056F\u0580 \u0578\u0582\u0572\u0565\u056E\u0580\u056B \u0578\u0582\u0572\u0565\u056E\u0580\u0578\u057E \u0578\u0582\u0574 \u0578\u0582\u0576\u0565\u0576 \u0578\u0582\u0576\u0565\u0576\u0578\u0582\u0574 \u0578\u0582\u0576\u0565\u0580 \u0578\u0582\u0576\u0565\u0581\u0565\u056C \u0578\u0582\u0576\u0565\u0581\u0578\u0572 \u0578\u0582\u0576\u056B \u0578\u0582\u0577 \u0578\u0582\u057D\u0578\u0582\u0574\u0576\u0561\u057D\u056B\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0576\u0565\u0580\u056B \u0579\u0565\u0576 \u0579\u0567\u0580 \u0579\u0578\u0580\u057D \u057A\u0561\u0570\u057A\u0561\u0576\u057E\u0565\u056C \u057A\u0561\u0577\u057F\u0578\u0576\u0561\u056F\u0561\u0576 \u057A\u0561\u057F\u0565\u0580\u0561\u0566\u0574\u056B \u057A\u0561\u057F\u056F\u0561\u0576\u0578\u0582\u0574 \u057A\u0561\u057F\u0573\u0561\u057C\u0578\u057E \u057A\u0561\u057F\u0574\u0561\u056F\u0561\u0576 \u057A\u0561\u057F\u0574\u0578\u0582\u0569\u0575\u0561\u0576 \u057A\u0561\u057F\u0580\u0561\u057D\u057F\u057E\u0561\u056E \u057A\u0565\u057F\u0561\u056F\u0561\u0576 \u057A\u0565\u057F\u0584 \u057A\u057F\u0578\u0582\u0575\u057F \u057B\u0580\u0561\u0575\u056B\u0576 \u057C\u0561\u0566\u0574\u0561\u056F\u0561\u0576 \u057C\u0565\u056A\u056B\u057D\u0578\u0580 \u057C\u0565\u057D\u0578\u0582\u0580\u057D\u0576\u0565\u0580\u056B \u057C\u0578\u0582\u057D \u057C\u0578\u0582\u057D\u0561\u056F\u0561\u0576 \u057C\u0578\u0582\u057D\u0565\u0580\u0565\u0576 \u057D\u0561\u056F\u0561\u0575\u0576 \u057D\u0565\u057A\u057F\u0565\u0574\u0562\u0565\u0580\u056B \u057D\u056F\u057D\u0565\u056C \u057D\u056F\u057D\u0578\u0582\u0574 \u057D\u057A\u0565\u056F\u057F\u0580\u0561\u056C \u057D\u057F\u0561\u0581\u0565\u056C \u057E\u0561\u0580\u0579\u0561 \u057E\u0561\u0580\u0579\u0561\u056F\u0561\u0576 \u057E\u0565\u0580\u0561\u0576\u0561\u0575\u057E\u0561\u056E \u057E\u0565\u0580\u057B\u056B\u0576 \u057E\u056B\u056C\u0561\u0575\u0565\u0569\u056B \u057E\u056B\u0573\u0561\u056F\u0561\u0563\u0580\u0561\u056F\u0561\u0576 \u057E\u056B\u0573\u0561\u056F\u0561\u0563\u0580\u0578\u0582\u0569\u0575\u0561\u0576 \u057E\u056B\u0573\u0561\u056F\u0561\u0563\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576 \u057E\u0580\u0561 \u057F\u0561\u056C\u056B\u057D \u057F\u0561\u056F \u057F\u0561\u0580\u0561\u056E\u0584 \u057F\u0561\u0580\u0561\u056E\u0584\u0561\u0575\u056B\u0576 \u057F\u0561\u0580\u0561\u056E\u0584\u0578\u0582\u0574 \u057F\u0561\u0580\u0562\u0565\u0580 \u057F\u0561\u0580\u0565\u056F\u0561\u0576 \u057F\u0561\u0580\u056B \u057F\u0561\u0580\u056B\u0576\u0565\u0580\u056B\u0576 \u057F\u0561\u0580\u057E\u0561 \u057F\u0565\u0572\u0561\u056F\u0561\u0575\u057E\u0561\u056E \u057F\u0565\u0572\u0561\u0576\u0578\u0582\u0576\u0576\u0565\u0580\u056B \u057F\u0565\u0572\u0561\u0583\u0578\u056D\u057E\u0565\u056C \u057F\u0565\u0572\u0565\u056F\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0576\u0565\u0580 \u057F\u0565\u0572\u056B \u057F\u0572\u0561\u0574\u0561\u0580\u0564 \u057F\u0576\u057F\u0565\u057D\u0561\u056F\u0561\u0576 \u057F\u0578\u0582\u0576 \u057F\u057E\u0575\u0561\u056C\u0576\u0565\u0580 \u057F\u057E\u0575\u0561\u056C\u0576\u0565\u0580\u0568 \u057F\u057E\u0575\u0561\u056C\u0576\u0565\u0580\u056B \u057F\u057E\u0575\u0561\u056C\u0576\u0565\u0580\u0578\u057E \u0581\u0561\u0576\u056F \u0581\u0561\u0576\u056F\u0568 \u0581\u0578\u0582\u0575\u0581 \u0583\u0565\u057F\u0580\u057E\u0561\u0580\u056B \u0583\u0578\u057D\u057F\u0561\u0575\u056B\u0576 \u0583\u0578\u0584\u0580 \u0584\u0561\u0572\u0561\u0584 \u0584\u0561\u0572\u0561\u0584\u0561\u056F\u0561\u0576 \u0584\u0561\u0572\u0561\u0584\u0568 \u0584\u0561\u0572\u0561\u0584\u056B \u0584\u0561\u0572\u0561\u0584\u056B\u0581 \u0584\u0561\u0572\u0561\u0584\u0578\u0582\u0574 \u0584\u0561\u0576 \u0584\u0561\u0576\u0561\u056F\u0561\u056F\u0561\u0576 \u0584\u0561\u0576\u056B \u0584\u0561\u0580\u057F\u0565\u0566\u0576\u0565\u0580 \u0585\u0563\u0578\u057D\u057F\u0578\u057D\u056B \u0585\u0563\u057F\u0561\u0563\u0578\u0580\u056E\u057E\u0578\u0582\u0574 \u0585\u0580\u056B\u0563\u056B\u0576\u0561\u056C\u056B\u0581 \u0585\u0580\u056B\u0576\u0561\u056F \u0585\u0580\u057E\u0561 \u0586\u0565\u0564\u0565\u0580\u0561\u056C \u0586\u056B\u056C\u0574\u0568 \u0586\u056B\u056C\u0574\u056B \u0586\u0580\u0561\u0576\u057D\u0565\u0580\u0565\u0576 \u10D0\u10D2\u10D5\u10D8\u10E1\u10E2\u10DD \u10D0\u10D2\u10E0\u10D4\u10D7\u10D5\u10D4 \u10D0\u10D3\u10D0\u10DB\u10D8\u10D0\u10DC\u10D8 \u10D0\u10D3\u10D0\u10DB\u10D8\u10D0\u10DC\u10E1 \u10D0\u10D3\u10D2\u10D8\u10DA\u10D8 \u10D0\u10D3\u10DB\u10D8\u10DC\u10D8\u10E1\u10E2\u10E0\u10D0\u10EA\u10D8\u10E3\u10DA\u10D8 \u10D0\u10DA\u10D1\u10DD\u10DB\u10D8 \u10D0\u10DB\u10D0\u10D5\u10D4 \u10D0\u10DB\u10D8\u10E1 \u10D0\u10DE\u10E0\u10D8\u10DA\u10D8 \u10D0\u10E0\u10D0 \u10D0\u10E0\u10D8\u10D0\u10DC \u10D0\u10E0\u10D8\u10E1 \u10D0\u10E0\u10E1\u10D4\u10D1\u10DD\u10D1\u10E1 \u10D0\u10E1\u10D4\u10D5\u10D4 \u10D0\u10E5\u10D5\u10E1 \u10D0\u10E6\u10DB\u10DD\u10E1\u10D0\u10D5\u10DA\u10D4\u10D7 \u10D0\u10E6\u10EC\u10D4\u10E0\u10D8\u10E1 \u10D0\u10E8\u10E8 \u10D0\u10EE\u10D0\u10DA\u10D8 \u10D2\u10D0\u10DB\u10DD \u10D2\u10D0\u10DB\u10DD\u10D5\u10D8\u10D3\u10D0 \u10D2\u10D0\u10DC\u10DB\u10D0\u10D5\u10DA\u10DD\u10D1\u10D0\u10E8\u10D8 \u10D2\u10D0\u10E0\u10D3\u10D0 \u10D2\u10D0\u10E0\u10D3\u10D0\u10D8\u10EA\u10D5\u10D0\u10DA\u10D0 \u10D2\u10D0\u10EE\u10D3\u10D0 \u10D2\u10D8\u10DD\u10E0\u10D2\u10D8 \u10D3\u10D0\u10D0\u10E0\u10E5\u10D8\u10D5\u10D4\u10D1\u10E3\u10DA\u10D8\u10D0 \u10D3\u10D0\u10D0\u10EE\u10DA\u10DD\u10D4\u10D1\u10D8\u10D7 \u10D3\u10D0\u10D8\u10D1\u10D0\u10D3\u10D0 \u10D3\u10D0\u10D8\u10EC\u10E7\u10DD \u10D3\u10D0\u10E1\u10D0\u10D5\u10DA\u10D4\u10D7 \u10D3\u10D4\u10D9\u10D4\u10DB\u10D1\u10D4\u10E0\u10D8 \u10D3\u10D8\u10D3 \u10D3\u10D8\u10D3\u10D8 \u10D3\u10DD\u10DC\u10D8\u10D3\u10D0\u10DC \u10D3\u10E0\u10DD\u10E1 \u10D4\u10D9\u10DA\u10D4\u10E1\u10D8\u10D0 \u10D4\u10D9\u10DA\u10D4\u10E1\u10D8\u10D8\u10E1 \u10D4\u10DC\u10EA\u10D8\u10D9\u10DA\u10DD\u10DE\u10D4\u10D3\u10D8\u10D0 \u10D4\u10E0\u10D7 \u10D4\u10E0\u10D7\u10D0\u10D3 \u10D4\u10E0\u10D7\u10D8 \u10D4\u10E0\u10DD\u10D5\u10DC\u10E3\u10DA\u10D8 \u10D4\u10E1\u10DE \u10D5\u10D4\u10E0 \u10D6\u10E6\u10D5\u10D8\u10E1 \u10D7\u10D0\u10D5\u10D8\u10E1 \u10D7\u10D0\u10D5\u10D8\u10E1\u10D8 \u10D7\u10D0\u10DC\u10D0\u10DB\u10D4\u10D3\u10E0\u10DD\u10D5\u10D4 \u10D7\u10D0\u10E0\u10D8\u10E6\u10D8 \u10D7\u10D1\u10D8\u10DA\u10D8\u10E1\u10D8 \u10D7\u10D1\u10D8\u10DA\u10D8\u10E1\u10D8\u10E1 \u10D7\u10D4\u10D1\u10D4\u10E0\u10D5\u10D0\u10DA\u10D8 \u10D7\u10E3\u10DB\u10EA\u10D0 \u10D8\u10D0\u10DC \u10D8\u10D0\u10DC\u10D5\u10D0\u10E0\u10D8 \u10D8\u10D2\u10D8 \u10D8\u10D5\u10DA\u10D8\u10E1\u10D8 \u10D8\u10D5\u10DC\u10D8\u10E1\u10D8 \u10D8\u10DC\u10D2\u10DA \u10D8\u10DC\u10D2\u10DA\u10D8\u10E1\u10E3\u10E0\u10D8 \u10D8\u10E1\u10D8\u10DC\u10D8 \u10D8\u10E1\u10E2\u10DD\u10E0\u10D8\u10D0 \u10D8\u10E5\u10DC\u10D0 \u10D8\u10E7\u10D5\u10DC\u10D4\u10DC \u10D8\u10E7\u10DD \u10D9\u10D8\u10D3\u10D4\u10D5 \u10D9\u10DA\u10D0\u10E1\u10D8\u10E1 \u10DB\u10D0\u10D2\u10E0\u10D0\u10DB \u10DB\u10D0\u10D7 \u10DB\u10D0\u10D7\u10D8 \u10DB\u10D0\u10D8\u10E1\u10D8 \u10DB\u10D0\u10DC \u10DB\u10D0\u10E0\u10E2\u10D8 \u10DB\u10D0\u10E1 \u10DB\u10D3\u10D4 \u10DB\u10D3\u10D4\u10D1\u10D0\u10E0\u10D4\u10DD\u10D1\u10E1 \u10DB\u10D3\u10D8\u10DC\u10D0\u10E0\u10D4 \u10DB\u10D4\u10DD\u10E0\u10D4 \u10DB\u10D4\u10E1\u10D0\u10DB\u10D4 \u10DB\u10D4\u10E2\u10D8 \u10DB\u10D4\u10E2\u10E0\u10D6\u10D4 \u10DB\u10D4\u10E4\u10D4 \u10DB\u10D7\u10D0\u10D5\u10D0\u10E0\u10D8 \u10DB\u10D7\u10D4\u10DA\u10D8 \u10DB\u10D8\u10D4\u10D9\u10E3\u10D7\u10D5\u10DC\u10D4\u10D1\u10D0 \u10DB\u10D8\u10D4\u10E0 \u10DB\u10D8\u10D8\u10E6\u10DD \u10DB\u10D8\u10E1 \u10DB\u10D8\u10E1\u10D8 \u10DB\u10D8\u10E3\u10EE\u10D4\u10D3\u10D0\u10D5\u10D0\u10D3 \u10DB\u10D8\u10EE\u10D4\u10D3\u10D5\u10D8\u10D7 \u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D5\u10D0\u10DC\u10D8 \u10DB\u10DD\u10D2\u10D5\u10D8\u10D0\u10DC\u10D4\u10D1\u10D8\u10D7 \u10DB\u10DD\u10DC\u10D0\u10EA\u10D4\u10DB\u10D4\u10D1\u10D8 \u10DB\u10DD\u10DC\u10D0\u10EA\u10D4\u10DB\u10D4\u10D1\u10D8\u10D7 \u10DB\u10DD\u10E1\u10D0\u10EE\u10DA\u10D4\u10DD\u10D1\u10D0 \u10DB\u10DD\u10E1\u10D0\u10EE\u10DA\u10D4\u10DD\u10D1\u10D8\u10E1 \u10DB\u10E1\u10DD\u10E4\u10DA\u10D8\u10DD \u10DB\u10E3\u10DC\u10D8\u10EA\u10D8\u10DE\u10D0\u10DA\u10D8\u10E2\u10D4\u10E2\u10D8 \u10DB\u10E3\u10DC\u10D8\u10EA\u10D8\u10DE\u10D0\u10DA\u10D8\u10E2\u10D4\u10E2\u10E8\u10D8 \u10DB\u10EA\u10D8\u10E0\u10D4 \u10DB\u10EE\u10DD\u10DA\u10DD\u10D3 \u10DC\u10D0\u10EC\u10D8\u10DA\u10D8 \u10DC\u10D0\u10EC\u10D8\u10DA\u10E8\u10D8 \u10DC\u10DD\u10D4\u10DB\u10D1\u10D4\u10E0\u10D8 \u10DD\u10DB\u10D8\u10E1 \u10DD\u10E0\u10D8 \u10DD\u10E0\u10D8\u10D2\u10D8\u10DC\u10D0\u10DA\u10D8\u10D3\u10D0\u10DC \u10DD\u10E4\u10D8\u10EA\u10D8\u10D0\u10DA\u10E3\u10E0\u10D8 \u10DD\u10E5\u10E2\u10DD\u10DB\u10D1\u10D4\u10E0\u10D8 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0 \u10DE\u10D4\u10E0\u10D8\u10DD\u10D3\u10E8\u10D8 \u10DE\u10D8\u10E0\u10D5\u10D4\u10DA \u10DE\u10D8\u10E0\u10D5\u10D4\u10DA\u10D0\u10D3 \u10DE\u10D8\u10E0\u10D5\u10D4\u10DA\u10D8 \u10DE\u10DD\u10DA\u10D8\u10E2\u10D8\u10D9\u10E3\u10E0\u10D8 \u10E0\u10D0\u10D3\u10D2\u10D0\u10DC \u10E0\u10D0\u10D8\u10DD\u10DC\u10D8 \u10E0\u10D0\u10D8\u10DD\u10DC\u10E8\u10D8 \u10E0\u10D0\u10DB\u10D3\u10D4\u10DC\u10D8\u10DB\u10D4 \u10E0\u10D0\u10EA \u10E0\u10D4\u10E1\u10DE\u10E3\u10D1\u10DA\u10D8\u10D9\u10D8\u10E1 \u10E0\u10D8\u10E1 \u10E0\u10DD\u10D2\u10DD\u10E0\u10EA \u10E0\u10DD\u10D3\u10D4\u10E1\u10D0\u10EA \u10E0\u10DD\u10DB \u10E0\u10DD\u10DB\u10D4\u10DA\u10D8\u10EA \u10E0\u10DD\u10DB\u10D4\u10DA\u10DB\u10D0\u10EA \u10E0\u10DD\u10DB\u10D4\u10DA\u10E1\u10D0\u10EA \u10E0\u10DD\u10DB\u10DA\u10D4\u10D1\u10D8\u10EA \u10E0\u10DD\u10DB\u10DA\u10D8\u10E1 \u10E0\u10E3\u10E1\u10D4\u10D7\u10D8\u10E1 \u10E1\u10D0\u10D1\u10ED\u10DD\u10D7\u10D0 \u10E1\u10D0\u10D3\u10D0\u10EA \u10E1\u10D0\u10D4\u10E0\u10D7\u10D0\u10E8\u10DD\u10E0\u10D8\u10E1\u10DD \u10E1\u10D0\u10D4\u10E0\u10D7\u10DD \u10E1\u10D0\u10D8\u10E2\u10D6\u10D4 \u10E1\u10D0\u10D8\u10E2\u10D8 \u10E1\u10D0\u10D9\u10E3\u10D7\u10D0\u10E0\u10D8 \u10E1\u10D0\u10DB\u10D4\u10E4\u10DD \u10E1\u10D0\u10DB\u10D8 \u10E1\u10D0\u10DB\u10EE\u10D4\u10D3\u10E0\u10DD \u10E1\u10D0\u10DB\u10EE\u10E0\u10D4\u10D7 \u10E1\u10D0\u10E3\u10D9\u10D4\u10D7\u10D4\u10E1\u10DD \u10E1\u10D0\u10E3\u10D9\u10E3\u10DC\u10D4\u10E8\u10D8 \u10E1\u10D0\u10E3\u10D9\u10E3\u10DC\u10D8\u10E1 \u10E1\u10D0\u10E4\u10E0\u10D0\u10DC\u10D2\u10D4\u10D7\u10D8\u10E1 \u10E1\u10D0\u10E5\u10D0\u10E0\u10D7\u10D5\u10D4\u10DA\u10DD\u10E1 \u10E1\u10D0\u10E5\u10D0\u10E0\u10D7\u10D5\u10D4\u10DA\u10DD\u10E8\u10D8 \u10E1\u10D0\u10E7\u10DD\u10D5\u10D4\u10DA\u10D7\u10D0\u10DD \u10E1\u10D0\u10EE\u10D4\u10DA\u10D8 \u10E1\u10D0\u10EE\u10D4\u10DA\u10DB\u10EC\u10D8\u10E4\u10DD \u10E1\u10D4\u10E5\u10E2\u10D4\u10DB\u10D1\u10D4\u10E0\u10D8 \u10E1\u10D8\u10D0 \u10E1\u10D8\u10DB\u10E6\u10D4\u10E0\u10D0 \u10E1\u10D8\u10DB\u10ED\u10D8\u10D3\u10E0\u10DD\u10D5\u10D4 \u10E1\u10DD\u10E4\u10D4\u10DA\u10D8 \u10E1\u10DD\u10E4\u10D4\u10DA\u10E8\u10D8 \u10E1\u10E2\u10D0\u10E2\u10D8\u10E1\u10E2\u10D8\u10D9\u10D8\u10E1 \u10E1\u10EE\u10D5\u10D0 \u10E1\u10EE\u10D5\u10D0\u10D3\u10D0\u10E1\u10EE\u10D5\u10D0 \u10E2\u10D4\u10E0\u10D8\u10E2\u10DD\u10E0\u10D8\u10D0\u10D6\u10D4 \u10E2\u10D8\u10DE\u10D8\u10E1 \u10E3\u10D9\u10D5\u10D4 \u10E3\u10DC\u10D3\u10D0 \u10E3\u10E4\u10E0\u10DD \u10E4\u10D0\u10E0\u10D7\u10DD\u10D1\u10D8 \u10E5\u10D0\u10DA\u10D0\u10E5 \u10E5\u10D0\u10DA\u10D0\u10E5\u10D8 \u10E5\u10D0\u10DA\u10D0\u10E5\u10D8\u10E1 \u10E5\u10D0\u10E0\u10D7\u10D5\u10D4\u10DA\u10D8 \u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8 \u10E5\u10D5\u10D4\u10E7\u10DC\u10D8\u10E1 \u10E7\u10D5\u10D4\u10DA\u10D0 \u10E7\u10D5\u10D4\u10DA\u10D0\u10D6\u10D4 \u10E8\u10D4\u10D0\u10D3\u10D2\u10D4\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D0\u10D3\u10D2\u10D4\u10DC\u10E1 \u10E8\u10D4\u10D3\u10D4\u10D2\u10D0\u10D3 \u10E8\u10D4\u10D3\u10D8\u10E1 \u10E8\u10D4\u10D8\u10EB\u10DA\u10D4\u10D1\u10D0 \u10E8\u10D4\u10DB\u10D0\u10D3\u10D2\u10D4\u10DC\u10DA\u10DD\u10D1\u10D0\u10E8\u10D8 \u10E8\u10D4\u10DB\u10D3\u10D4\u10D2 \u10E8\u10D4\u10E1\u10D0\u10EE\u10D4\u10D1 \u10E8\u10DD\u10E0\u10D8\u10E1 \u10E8\u10E3\u10D0 \u10E9\u10E0\u10D3\u10D8\u10DA\u10DD \u10E9\u10E0\u10D3\u10D8\u10DA\u10DD\u10D4\u10D7 \u10EA\u10D4\u10DC\u10E2\u10E0\u10D8 \u10EA\u10DC\u10DD\u10D1\u10D8\u10DA\u10D8 \u10EA\u10EE\u10DD\u10D5\u10E0\u10DD\u10D1\u10E1 \u10EB\u10D0\u10DA\u10D8\u10D0\u10DC \u10EB\u10D5\u10D4\u10DA\u10D8 \u10EB\u10D8\u10E0\u10D8\u10D7\u10D0\u10D3\u10D0\u10D3 \u10EB\u10D8\u10E0\u10D8\u10D7\u10D0\u10D3\u10D8 \u10EC\u10D0\u10D9\u10D8\u10D7\u10EE\u10D5\u10D8\u10E1 \u10EC\u10D0\u10E0\u10DB\u10DD\u10D0\u10D3\u10D2\u10D4\u10DC\u10E1 \u10EC\u10D4\u10D5\u10E0\u10D8 \u10EC\u10D4\u10DA\u10D8 \u10EC\u10D4\u10DA\u10E1 \u10EC\u10D8\u10DC\u10D0\u10D0\u10E6\u10DB\u10D3\u10D4\u10D2 \u10EC\u10DA\u10D0\u10DB\u10D3\u10D4 \u10EC\u10DA\u10D4\u10D1\u10D8\u10E1 \u10EC\u10DA\u10D4\u10D1\u10E8\u10D8 \u10EC\u10DA\u10D8\u10D3\u10D0\u10DC \u10EC\u10DA\u10D8\u10E1 \u10EC\u10DB\u10D8\u10DC\u10D3\u10D0 \u10EE\u10DD\u10DA\u10DD \u10EE\u10E8\u10D8\u10E0\u10D0\u10D3 \u10EF\u10D2\u10E3\u10E4\u10D8\u10E1 \u10EF\u10D4\u10E0 \u10F0\u10E5\u10DD\u10DC\u10D3\u10D0 \u1EA3nh \u1ED1ng \u1EE7ng \u1EE9ng`.split(" "));

// src/engine/vocabulaire.js
var SUFFIXES_COMMUNS = /(?:ment|tion|sion|isme|iste|ateur|eur|trice|able|ible|ité|isée|isé|ifié|logie|graphie)s?$/i;
var MOTS_OUTILS = /^(?:de|du|des|d|la|le|les|l|un|une|et|à|au|aux|en|sur|pour|par|dans|avec)$/i;
var auLexique = (mot) => LEXIQUE_COURANT.has(String(mot || "").trim().toLowerCase());
var aSuffixeCommun = (mot) => SUFFIXES_COMMUNS.test(String(mot || "").trim());
function motsSignificatifs(valeur) {
  return String(valeur || "").split(/[\s&'’/,.-]+/).filter((m) => new RegExp("\\p{L}{2}", "u").test(m) && !MOTS_OUTILS.test(m));
}
function estMotCourant(mot) {
  const nu = String(mot || "").trim();
  if (!nu) return false;
  return auLexique(nu) || aSuffixeCommun(nu);
}
function estVocabulaireCourant(valeur) {
  const mots = motsSignificatifs(valeur);
  return mots.length > 0 && mots.every(estMotCourant);
}

// src/engine/gliner.js
var GLINER_MODEL = "onnx-community/gliner_small-v2";
var VARIANTES_MODELE = {
  quantized: "model_quantized.onnx",
  // 175 Mo, int8
  fp16: "model_fp16.onnx",
  // 292 Mo — défaut
  fp32: "model.onnx"
  // 583 Mo
};
var GLINER_VARIANTE = "fp16";
var glinerModelUrl = (variante = GLINER_VARIANTE) => `https://huggingface.co/${GLINER_MODEL}/resolve/main/onnx/${VARIANTES_MODELE[variante]}`;
var GLINER_THRESHOLD = 0.5;
var GROUPES = [
  {
    // Le cœur : ce que le NER BERT couvrait déjà, en mieux sur les valeurs
    // isolées.
    //
    // Seuil ABAISSÉ à 0,45 une première fois (nom de CV isolé, 0,47), puis à
    // 0,38 le 05/08/2026 — trouvé sur un vrai rapport (`rapport-fr.txt`) : le
    // patronyme « ROUSSEAU » matche le motif BIC et annule « Amandine
    // ROUSSEAU » dans la fusion (voir merge.js), mais le nom lui-même ne
    // dépassait le seuil sur AUCUNE de ses 3 occurrences (0,364 / 0,398).
    // « Nadia Belkacem » (`dossier-rh.txt`) était dans le même cas.
    //
    // Seuil choisi par balayage sur le banc COMPLET, pas par extrapolation :
    // 0,45 → 0,40 → 0,38 → 0,36 → 0,35. 0,38 est le point pivot exact où les
    // deux noms sont trouvés SANS qu'aucun faux positif n'apparaisse. En
    // dessous (0,36), « CERTIFICAT DE SCOLARITE » (titre en capitales) devient
    // un faux positif PER et le préservé de `certificat-fr.txt` chute de
    // 100 % à 67 %. Ne pas descendre sans re-vérifier CE cas précis.
    //
    // Effet mesuré : rappel contextuel 78 → 83 %, préservé INCHANGÉ (98 %),
    // structuré inchangé. Plus aucune fuite partielle sur les 7 documents.
    //
    // RECALIBRÉ à 0,46 le 06/08/2026 en passant les poids de int8 à fp16.
    // LEÇON GÉNÉRALE : **un seuil appartient à une variante de poids.** Le fp16
    // est numériquement plus précis, tous les scores remontent, et le 0,38
    // calibré sur l'int8 devenait trop bas — préservé 98 % → 93 %
    // (« SOMMAIRE » et « Docker » sur-masqués en plus). Changer de variante
    // SANS rebalayer, c'est troquer de la qualité contre de la vitesse sans
    // s'en apercevoir.
    //
    // Balayage sur le banc complet, en fp16 :
    //   0,38 → 83 % / 93 %      0,42 → 83 % / 93 %
    //   0,45 → 83 % / 96 %      0,46 → 83 % / **98 %**  ← retenu
    //   0,47 / 0,48 → identiques à 0,46 (plateau)
    //   0,50 → casse le STRUCTURÉ (19/20) : rédhibitoire, non négociable
    // 0,46 est le plus BAS du plateau — donc le plus détectant à qualité égale,
    // conformément à « zéro-fuite > faux positifs ».
    seuil: 0.46,
    labels: ["person", "company", "location"],
    types: { person: "PER", company: "ORG", location: "LOC" },
    // Voir `pertinent` plus bas : un texte sans la moindre majuscule ne peut
    // produire aucun nom propre, donc aucune entité de ce groupe.
    pertinent: (t) => new RegExp("\\p{Lu}", "u").test(t)
  },
  {
    // Seul : associé à d'autres labels il perd sa précision, et « address »
    // faisait monter le bruit du garde-fou à 0,47 (trop près du seuil).
    // Les adresses restent couvertes par le motif ADRESSE, déterministe.
    labels: ["date of birth"],
    types: { "date of birth": "DATE_NAISSANCE" },
    // Une date porte toujours au moins l'année : sans chiffre, rien à trouver.
    // 65 % des unités d'un vrai mémoire sont dans ce cas — 54 % du texte.
    pertinent: (t) => /\d/.test(t)
  },
  {
    // Catégories sensibles au sens RGPD (santé, origine) + contexte pro.
    // Vérifié : zéro faux positif sur les 3 fixtures ET sur une ligne de
    // stack technique (« React, Docker, Prisma… »).
    labels: ["job title", "nationality", "school", "medical condition"],
    types: {
      "job title": "POSTE",
      nationality: "NATIONALITE",
      school: "ETABLISSEMENT",
      "medical condition": "SANTE"
    }
  }
];
var TYPES_PEU_FIABLES = ["POSTE", "NATIONALITE", "ETABLISSEMENT", "SANTE"];
var typesDuGroupe = (g) => Object.values(g.types);
var TYPES_NOMS_PROPRES = /* @__PURE__ */ new Set(["PER", "ORG", "LOC"]);
var DATE_NUMERIQUE = /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/;
var ANNEES = /(?:1[89]|20)\d{2}/g;
function estUneDate(valeur) {
  const annees = String(valeur || "").match(ANNEES) || [];
  if (annees.length > 1) return false;
  if (DATE_NUMERIQUE.test(valeur)) return true;
  if (annees.length !== 1) return false;
  return /\d/.test(String(valeur).replace(annees[0], ""));
}
var PRONOMS = /* @__PURE__ */ new Set([
  "i",
  "me",
  "my",
  "mine",
  "myself",
  "you",
  "your",
  "yours",
  "he",
  "him",
  "his",
  "she",
  "her",
  "hers",
  "it",
  "its",
  "we",
  "us",
  "our",
  "ours",
  "they",
  "them",
  "their",
  "theirs",
  "this",
  "that",
  "these",
  "those",
  "who",
  "whom",
  "whose",
  "je",
  "me",
  "moi",
  "tu",
  "toi",
  "il",
  "elle",
  "on",
  "nous",
  "vous",
  "ils",
  "elles",
  "lui",
  "leur",
  "leurs",
  "celui",
  "celle",
  "ceux",
  "celles",
  "ceci",
  "cela",
  "qui",
  "que",
  "dont",
  "yo",
  "tu",
  "el",
  "ella",
  "nosotros",
  "vosotros",
  "ellos",
  "ellas",
  "ich",
  "du",
  "er",
  "sie",
  "es",
  "wir",
  "ihr",
  "sein",
  "ihre"
]);
function estPronom(valeur) {
  const nu = String(valeur || "").trim().toLowerCase();
  const avantApostrophe = nu.split(/['’]/)[0];
  return PRONOMS.has(nu) || (nu.includes("'") || nu.includes("\u2019") ? PRONOMS.has(avantApostrophe) : false);
}
var TYPES_FILTRES_PAR_VOCABULAIRE = /* @__PURE__ */ new Set(["ORG", "LOC"]);
function estPlausiblePourLeType(type, valeur) {
  if (TYPES_NOMS_PROPRES.has(type)) {
    if (estPronom(valeur)) return false;
    if (!new RegExp("\\p{Lu}", "u").test(valeur)) return false;
    if (TYPES_FILTRES_PAR_VOCABULAIRE.has(type) && estVocabulaireCourant(valeur)) return false;
    return true;
  }
  if (type === "DATE_NAISSANCE") return estUneDate(valeur);
  return true;
}
function desaccentuer(texte) {
  let sortie = "";
  for (const ch of texte) {
    const nu = ch.normalize("NFD").replace(new RegExp("\\p{M}+", "gu"), "");
    sortie += nu.length === ch.length ? nu : ch;
  }
  return sortie;
}
var MOT_TOUT_CAPITALES = new RegExp("\\p{Lu}[\\p{Lu}'\u2019-]{2,}", "gu");
function adoucirCasse(texte) {
  return String(texte || "").replace(MOT_TOUT_CAPITALES, (mot) => {
    const lettres = [...mot];
    const suite = lettres.slice(1).map((ch) => {
      const bas = ch.toLowerCase();
      return bas.length === ch.length ? bas : ch;
    }).join("");
    return lettres[0] + suite;
  });
}
async function detectGliner(text, glinerPipeline, { onProgress, disabledTypes: disabledTypes2 } = {}) {
  if (!glinerPipeline) return [];
  const desactives = disabledTypes2 || /* @__PURE__ */ new Set();
  const groupesActifs = GROUPES.filter((g) => typesDuGroupe(g).some((t) => !desactives.has(t)));
  if (!groupesActifs.length) return [];
  const chunks = chunkText(text);
  let total = 0;
  for (const { text: c } of chunks) {
    for (const g of groupesActifs) if (!g.pertinent || g.pertinent(c)) total++;
  }
  const all = [];
  let done = 0;
  for (const { offset, text: chunk } of chunks) {
    const duChunk = [];
    const chunkNu = desaccentuer(chunk);
    const chunkCasse = adoucirCasse(chunk);
    const variantes = [chunk];
    if (chunkNu !== chunk) variantes.push(chunkNu);
    if (chunkCasse !== chunk) variantes.push(chunkCasse);
    for (const groupe of groupesActifs) {
      if (groupe.pertinent && !groupe.pertinent(chunk)) continue;
      const seuil = groupe.seuil ?? GLINER_THRESHOLD;
      for (const variante of variantes) {
        const spans = await glinerPipeline(variante, groupe.labels);
        for (const s of spans || []) {
          const type = groupe.types[s.label];
          if (!type || desactives.has(type) || s.score < seuil) continue;
          const valeur = chunk.slice(s.start, s.end);
          if (!estPlausiblePourLeType(type, valeur)) continue;
          duChunk.push({
            type,
            value: valeur,
            start: s.start,
            end: s.end,
            source: "ner",
            score: s.score,
            validated: "n/a"
          });
        }
      }
      if (onProgress) await onProgress({ done: ++done, total });
    }
    duChunk.sort(
      (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start) || b.score - a.score
    );
    const gardes = [];
    for (const e of duChunk) {
      if (gardes.some((k) => e.start < k.end && e.end > k.start)) continue;
      gardes.push(e);
    }
    for (const e of gardes) all.push({ ...e, start: e.start + offset, end: e.end + offset });
  }
  snapToWordBoundaries(text, all);
  bridgeNameParts(text, all);
  const vus = /* @__PURE__ */ new Set();
  return all.filter((e) => {
    const k = `${e.start}:${e.end}:${e.type}`;
    if (vus.has(k)) return false;
    vus.add(k);
    return true;
  }).sort((a, b) => a.start - b.start);
}
var LABELS_LEURRE = ["job title", "section heading", "common noun", "skill or hobby"];
async function arbitrerFauxPositifs(entities, glinerPipeline) {
  if (!glinerPipeline || !entities?.length) return entities || [];
  const labelsPII = GROUPES[0].labels;
  const tous = [...labelsPII, ...LABELS_LEURRE];
  const candidats = [...new Set(
    entities.filter((e) => e.source === "ner" && TYPES_NOMS_PROPRES.has(e.type)).map((e) => e.value)
  )];
  if (!candidats.length) return entities;
  const rejete = /* @__PURE__ */ new Set();
  await Promise.all(candidats.map(async (valeur) => {
    let spans;
    try {
      spans = await glinerPipeline(valeur, tous);
    } catch {
      return;
    }
    let pii = 0, leurre = 0;
    for (const s of spans || []) {
      if ((s.spanText || "").trim() !== valeur.trim()) continue;
      if (LABELS_LEURRE.includes(s.label)) leurre = Math.max(leurre, s.score);
      else pii = Math.max(pii, s.score);
    }
    if (leurre > pii) rejete.add(valeur);
  }));
  return entities.filter((e) => !rejete.has(e.value));
}

// src/engine/caracteristiques.js
var borne = (x, max) => Math.min(Math.max(x, 0), max) / max;
var part = (n, total) => total ? n / total : 0;
var LIAISON = /[&·•/|—–+]/;
function contexteDocument(texte, { sousMots } = {}) {
  const brut = String(texte || "");
  const enMinuscules = /* @__PURE__ */ new Set();
  const comptes = /* @__PURE__ */ new Map();
  for (const m of brut.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []) {
    const bas = m.toLowerCase();
    comptes.set(bas, (comptes.get(bas) || 0) + 1);
    if (m[0] === bas[0]) enMinuscules.add(bas);
  }
  return { enMinuscules, comptes, sousMots };
}
function segmenter(mot, sousMots) {
  let i = 0, n = 0;
  while (i < mot.length) {
    let j = mot.length;
    let trouve = null;
    while (j > i) {
      const piece = i === 0 ? mot.slice(i, j) : "##" + mot.slice(i, j);
      if (sousMots.has(piece)) {
        trouve = j;
        break;
      }
      j--;
    }
    if (trouve === null) return mot.length;
    n++;
    i = trouve;
  }
  return n || 1;
}
function morceaux(mot, sousMots) {
  if (!sousMots) return 1;
  const brut = String(mot || "");
  if (!brut) return 1;
  const bas = brut.toLowerCase();
  const titre = bas[0].toUpperCase() + bas.slice(1);
  let mini = segmenter(brut, sousMots);
  for (const forme of [bas, titre]) {
    if (forme === brut) continue;
    mini = Math.min(mini, segmenter(forme, sousMots));
    if (mini === 1) break;
  }
  return mini;
}
function caracteristiques(candidat, ctx) {
  const valeur = String(candidat?.value ?? "");
  const mots = motsSignificatifs(valeur);
  const n = mots.length;
  const nbLexique = mots.filter(auLexique).length;
  const nbSuffixe = mots.filter((m) => !auLexique(m) && aSuffixeCommun(m)).length;
  const nbMinusculeAilleurs = mots.filter((m) => ctx.enMinuscules.has(m.toLowerCase())).length;
  const occ = Math.max(...mots.map((m) => ctx.comptes.get(m.toLowerCase()) || 1), 1);
  const morceauxMoyens = ctx.sousMots && n ? mots.reduce((s, m) => s + morceaux(m, ctx.sousMots), 0) / n : 1;
  return {
    // — ce que dit le vocabulaire —
    partLexique: part(nbLexique, n),
    partSuffixe: part(nbSuffixe, n),
    aucunCourant: n && nbLexique + nbSuffixe === 0 ? 1 : 0,
    // — ce que dit la forme —
    toutCapitales: valeur === valeur.toUpperCase() && new RegExp("\\p{Lu}", "u").test(valeur) ? 1 : 0,
    casseDeTitre: n && mots.every((m) => new RegExp("^\\p{Lu}", "u").test(m)) ? 1 : 0,
    aChiffre: /\d/.test(valeur) ? 1 : 0,
    liaisonInterne: LIAISON.test(valeur) ? 1 : 0,
    nbMots: borne(n, 5),
    longueur: borne(valeur.length, 40),
    fragmentation: borne(morceauxMoyens - 1, 3),
    // — ce que dit le document —
    occurrences: borne(Math.log1p(occ - 1), Math.log1p(19)),
    minusculeAilleurs: part(nbMinusculeAilleurs, n),
    // — ce que dit le modèle —
    // En dernier, et volontairement : mesuré sur un vrai CV, le score seul ne
    // sépare RIEN (vraies 0,738 · fausses 0,648, et le meilleur score du
    // document est un faux positif). Il n'a sa place qu'en compagnie des autres.
    score: borne(Number(candidat?.score) || 0, 1)
  };
}
var NOMS_CARACTERISTIQUES = Object.keys(
  caracteristiques({ value: "x", score: 0 }, contexteDocument(""))
);

// src/engine/poids-precision.js
var POIDS = {
  seuil: 0.21,
  biais: -2.7269,
  poids: {
    partLexique: -0.8536,
    aucunCourant: 2.565,
    toutCapitales: 0,
    casseDeTitre: -2.6142,
    aChiffre: 4.433,
    liaisonInterne: -0.0844,
    nbMots: 10.2502,
    longueur: -8.0767,
    occurrences: -1.8454,
    minusculeAilleurs: -4.186,
    score: 4.2489
  }
};

// src/engine/precision.js
var TYPES_FILTRES = /* @__PURE__ */ new Set(["ORG", "LOC"]);
var sigmoide = (z) => 1 / (1 + Math.exp(-z));
function scorePrecision(candidat, ctx, modele = POIDS) {
  if (!modele) return 1;
  const c = caracteristiques(candidat, ctx);
  let z = modele.biais;
  for (const [nom, w] of Object.entries(modele.poids)) z += w * (c[nom] ?? 0);
  return sigmoide(z);
}
function expliquer(candidat, ctx, modele = POIDS) {
  if (!modele) return null;
  const c = caracteristiques(candidat, ctx);
  let pire = null;
  for (const [nom, w] of Object.entries(modele.poids)) {
    const x = c[nom] ?? 0;
    const ecart = w < 0 ? w * x : w * (x - 1);
    if (ecart < 0 && (!pire || ecart < pire.ecart)) pire = { nom, ecart };
  }
  return pire?.nom ?? null;
}
var MOTS_MINIMUM = 2;
var formeDeNomPropre = (valeur) => {
  if (/\d/.test(valeur)) return false;
  const mots = motsSignificatifs(valeur);
  return mots.length >= 2 && mots.length <= 3 && mots.every((m) => new RegExp("^\\p{Lu}[\\p{Ll}'\u2019-]+$", "u").test(m));
};
var filtrable = (e) => e.source === "ner" && TYPES_FILTRES.has(e.type) && motsSignificatifs(e.value).length >= MOTS_MINIMUM && !formeDeNomPropre(e.value);
function filtrerParPrecision(entities, texte, { modele = POIDS, sousMots, journal } = {}) {
  if (!modele || !entities?.length) return entities || [];
  const ctx = contexteDocument(texte, { sousMots });
  return entities.filter((e) => {
    if (!filtrable(e)) return true;
    const p = scorePrecision(e, ctx, modele);
    if (p >= modele.seuil) return true;
    if (journal) journal.push({ valeur: e.value, type: e.type, p, motif: expliquer(e, ctx, modele) });
    return false;
  });
}
function composerArbitre(pipe, arbitrerFauxPositifs2) {
  if (!pipe) return void 0;
  return async (entities, texte) => filtrerParPrecision(await arbitrerFauxPositifs2(entities, pipe), texte);
}

// src/engine/vocabulaire-formats.js
var FORMATS = ["cv", "administratif", "scolaire", "bancaire"];
var MOTS_DE_FORME = {
  cv: {
    fr: [
      "exp\xE9riences professionnelles",
      "exp\xE9rience professionnelle",
      "comp\xE9tences",
      "curriculum vitae",
      "parcours professionnel",
      "centres d\u2019int\xE9r\xEAt",
      "langues parl\xE9es",
      "dipl\xF4mes",
      "certifications"
    ],
    en: [
      "work experience",
      "professional experience",
      "skills",
      "core skills",
      "curriculum vitae",
      "r\xE9sum\xE9",
      "career summary",
      "certifications"
    ],
    es: [
      "experiencia laboral",
      "experiencia profesional",
      "competencias",
      "curr\xEDculum v\xEDtae",
      "curr\xEDculum",
      "formaci\xF3n acad\xE9mica",
      "idiomas"
    ],
    de: [
      "berufserfahrung",
      "lebenslauf",
      "kenntnisse",
      "qualifikationen",
      "werdegang",
      "weiterbildung"
    ],
    pt: [
      "experi\xEAncia profissional",
      "compet\xEAncias",
      "curr\xEDculo",
      "forma\xE7\xE3o acad\xE9mica",
      "habilita\xE7\xF5es"
    ]
  },
  administratif: {
    fr: [
      "r\xE9publique fran\xE7aise",
      "minist\xE8re",
      "certificat de scolarit\xE9",
      "attestation",
      "je soussign\xE9",
      "je soussign\xE9e",
      "certifie que",
      "fait \xE0",
      "bulletin num\xE9ro",
      "casier judiciaire",
      "\xE9tat civil",
      "compte rendu",
      "entretien professionnel",
      "ressources humaines"
    ],
    en: [
      "hereby certify",
      "affidavit",
      "official record",
      "issued at",
      "registration number",
      "to whom it may concern"
    ],
    es: [
      "certifica que",
      "hace constar",
      "ministerio",
      "expediente",
      "documento nacional de identidad"
    ],
    de: [
      "bescheinigung",
      "hiermit wird bescheinigt",
      "ausgestellt am",
      "aktenzeichen",
      "beh\xF6rde"
    ],
    pt: ["certid\xE3o", "certifica que", "minist\xE9rio", "requerimento", "declara\xE7\xE3o"]
  },
  scolaire: {
    fr: [
      "sommaire",
      "introduction",
      "conclusion",
      "bibliographie",
      "remerciements",
      "rapport de stage",
      "probl\xE9matique",
      "annexes",
      "table des mati\xE8res",
      "soutenance",
      "travaux dirig\xE9s",
      "travaux pratiques",
      "contr\xF4le continu",
      "relev\xE9 de notes"
    ],
    en: [
      "table of contents",
      "introduction",
      "conclusion",
      "bibliography",
      "acknowledgements",
      "appendix",
      "abstract",
      "dissertation",
      "coursework"
    ],
    es: [
      "\xEDndice",
      "introducci\xF3n",
      "conclusi\xF3n",
      "bibliograf\xEDa",
      "agradecimientos",
      "anexos",
      "resumen"
    ],
    de: [
      "inhaltsverzeichnis",
      "einleitung",
      "fazit",
      "literaturverzeichnis",
      "danksagung",
      "anhang",
      "zusammenfassung"
    ],
    pt: [
      "\xEDndice",
      "introdu\xE7\xE3o",
      "conclus\xE3o",
      "bibliografia",
      "agradecimentos",
      "anexos",
      "resumo"
    ]
  },
  bancaire: {
    fr: [
      "relev\xE9 de compte",
      "titulaire du compte",
      "solde cr\xE9diteur",
      "solde d\xE9biteur",
      "virement",
      "pr\xE9l\xE8vement",
      "date de valeur"
    ],
    en: [
      "account statement",
      "account holder",
      "opening balance",
      "closing balance",
      "wire transfer",
      "direct debit"
    ],
    es: ["extracto de cuenta", "titular de la cuenta", "saldo", "transferencia"],
    de: ["kontoauszug", "kontoinhaber", "kontostand", "\xFCberweisung", "lastschrift"],
    pt: ["extrato de conta", "titular da conta", "saldo", "transfer\xEAncia"]
  }
};
function motsDeForme(format) {
  const parLangue = MOTS_DE_FORME[format] || {};
  return [...new Set(Object.values(parLangue).flat())];
}
var TOUS_LES_MOTS_DE_FORME = [
  ...new Set(FORMATS.flatMap(motsDeForme))
];

// src/engine/type-document.js
var POINTS_DE_SUITE = /\.{4,}\s*\d+\s*$/;
var ENTETE_EMAIL = /^(?:From|To|Cc|Subject|Sent|De|À|Objet|Envoyé)\s*:/i;
var PAIRE_LIBELLE = /^\s*[^\s:][^:\n]{1,28}(?::\s+|\s{2,})\S/;
var PUCE = /^\s*[•·▪◦‣*·]|(?:\s[•·▪◦‣]\s)/;
var PLAGE_DE_DATES = /(?:1[89]|20)\d{2}\s*[-–—à]\s*(?:(?:1[89]|20)\d{2}|en cours|présent|aujourd)/i;
var normaliser = (t) => " " + String(t || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim() + " ";
var MARQUEURS_NORMALISES = Object.fromEntries(
  FORMATS.map((f) => [f, motsDeForme(f).map((m) => normaliser(m).slice(1, -1))])
);
var ECART_MINIMAL = 1.5;
var compterLignes = (lignes, motif) => lignes.filter((l) => motif.test(l)).length;
function analyserTypeDocument(texte, { entites = [] } = {}) {
  const brut = String(texte || "");
  const lignes = brut.split(/\r?\n/).filter((l) => l.trim());
  if (lignes.length < 3) return { type: null, score: 0, indices: [] };
  const normalise = normaliser(brut);
  const n = lignes.length;
  const points = { cv: 0, administratif: 0, scolaire: 0, bancaire: 0, email: 0 };
  const indices = [];
  const noter = (type, valeur, raison) => {
    if (valeur <= 0) return;
    points[type] += valeur;
    indices.push({ type, raison, valeur: Number(valeur.toFixed(2)) });
  };
  const sommaire = compterLignes(lignes, POINTS_DE_SUITE);
  noter("scolaire", Math.min(sommaire, 8) * 0.6, `${sommaire} ligne(s) de sommaire`);
  const enTete = compterLignes(lignes.slice(0, 8), ENTETE_EMAIL);
  noter("email", enTete >= 2 ? 3 + enTete : 0, `${enTete} en-t\xEAte(s) d'e-mail`);
  const paires = compterLignes(lignes, PAIRE_LIBELLE) / n;
  noter("administratif", paires > 0.3 ? paires * 4 : 0, `${(paires * 100).toFixed(0)} % de paires libell\xE9/valeur`);
  const puces = compterLignes(lignes, PUCE) / n;
  noter("cv", puces > 0.1 ? puces * 6 : 0, `${(puces * 100).toFixed(0)} % de lignes \xE0 puces`);
  const plages = compterLignes(lignes, PLAGE_DE_DATES);
  noter("cv", Math.min(plages, 5) * 0.5, `${plages} plage(s) de dates`);
  const longueurMoyenne = brut.length / n;
  noter("scolaire", longueurMoyenne > 120 ? 1.5 : 0, `lignes longues (${longueurMoyenne.toFixed(0)} c.)`);
  noter("cv", longueurMoyenne < 70 ? 1 : 0, `lignes courtes (${longueurMoyenne.toFixed(0)} c.)`);
  const bancaires = entites.filter((e) => e.type === "IBAN" || e.type === "BIC").length;
  const montants = entites.filter((e) => e.type === "MONTANT").length;
  noter(
    "bancaire",
    bancaires * 2 + (montants > 5 ? 2 : 0),
    `${bancaires} IBAN/BIC, ${montants} montant(s)`
  );
  for (const [type, marqueurs] of Object.entries(MARQUEURS_NORMALISES)) {
    const trouves = marqueurs.filter((m) => normalise.includes(" " + m + " "));
    noter(type, trouves.length * 0.8, `mots : ${trouves.join(", ")}`);
  }
  const classement = Object.entries(points).sort((a, b) => b[1] - a[1]);
  const [premier, valeurPremier] = classement[0];
  const ecart = valeurPremier - classement[1][1];
  const sur = indices.filter((i) => i.type === premier);
  return {
    type: ecart >= ECART_MINIMAL && valeurPremier > 0 ? premier : null,
    score: Number(valeurPremier.toFixed(2)),
    ecart: Number(ecart.toFixed(2)),
    indices: sur,
    classement: classement.map(([t, v]) => [t, Number(v.toFixed(2))])
  };
}

// src/popup/profiles.js
var PROFILES_KEY = "clarenceProfiles";
var PROFILES_ECARTES_KEY = "clarenceProfilsEcartes";
var TECH_KEEP = [
  "React",
  "Angular",
  "Vue",
  "Svelte",
  "Node",
  "Node.js",
  "Deno",
  "Next.js",
  "Python",
  "Java",
  "Kotlin",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Scala",
  "C++",
  "C#",
  "FastAPI",
  "Django",
  "Flask",
  "Fastify",
  "Express",
  "Spring",
  "Laravel",
  "Symfony",
  "Prisma",
  "Sequelize",
  "Hibernate",
  "TypeORM",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "MariaDB",
  "Redis",
  "SQLite",
  "Elasticsearch",
  "Cassandra",
  "Docker",
  "Kubernetes",
  "Podman",
  "Terraform",
  "Ansible",
  "Ollama",
  "PyTorch",
  "TensorFlow",
  "Keras",
  "Scikit-learn",
  "NumPy",
  "Pandas",
  "Hugging Face",
  "Git",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "Jenkins",
  "CircleCI",
  "Linux",
  "Ubuntu",
  "Debian",
  "Bash",
  "Nginx",
  "Apache",
  "AWS",
  "Azure",
  "GCP",
  "Vercel",
  "Netlify",
  "Heroku",
  "Cloudflare",
  "Kafka",
  "Spark",
  "Airflow",
  "Hadoop",
  "Hive",
  "Sqoop",
  "RabbitMQ",
  "GraphQL",
  "Power BI",
  "Tableau",
  "Excel",
  "n8n",
  "Zapier",
  "Figma",
  "GPT-4o",
  "Llama",
  "Mistral",
  "Claude",
  "Gemini",
  "Transformers.js",
  "WebAssembly",
  // Tests, qualité, build — absents du premier jet, et masqués sur un vrai CV.
  "JUnit",
  "JaCoCo",
  "Pytest",
  "Jest",
  "Vitest",
  "Selenium",
  "Cypress",
  "Maven",
  "Gradle",
  "SonarQube",
  "Postman",
  "Swagger",
  // SIGLES DE MÉTIER. Trois lettres en capitales, donc happés en priorité
  // par la passe à casse adoucie (P12) : « LAMP » et « BDD » sortaient en
  // ENTREPRISE sur un CV réel. Jamais des données personnelles.
  "SQL",
  "BDD",
  "ETL",
  "API",
  "REST",
  "SOAP",
  "gRPC",
  "JWT",
  "CRUD",
  "ORM",
  "HTML",
  "CSS",
  "SCSS",
  "JSON",
  "XML",
  "CSV",
  "LAMP",
  "MERN",
  "CI/CD",
  "Sankey",
  "BeautifulSoup",
  "Requests",
  "Matplotlib",
  "Seaborn",
  // Relevés sur un vrai CV le 01/09/2026 : masqués tous les deux, et absents
  // de cette liste alors que tout le reste de la même rubrique y était.
  // « IA » sortait en LIEU trois fois, « NSI » en PERSONNE — deux types que le
  // filtre de précision ne touche jamais (garde-fous 3 et 4), donc la liste
  // éditable est bien le seul mécanisme qui les traite.
  //
  // Un terme de deux lettres est sans danger ici : la correspondance est
  // MOT À MOT (voir filterByRules). Vérifié — « IA » démasque « IA » et
  // « Data & IA », mais laisse « Julia Roberts » et « Sofia » masqués.
  "IA",
  "NSI"
];
var PUBLIC_KEEP = [
  "ChatGPT",
  "OpenAI",
  "GPT-4",
  "GPT-4o",
  "Claude",
  "Anthropic",
  "Gemini",
  "Copilot",
  "Mistral",
  "LLaMA",
  "DeepSeek",
  "DeepL",
  "Google Translate",
  "Google",
  "Microsoft",
  "Meta",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "Bing",
  "YouTube",
  "Reddit",
  "Wikipedia",
  "Twitter",
  "Slack",
  "Zoom",
  "Teams"
];
var STRUCTURE_KEEP = [
  "SOMMAIRE",
  "INTRODUCTION",
  "CONCLUSION",
  "REMERCIEMENTS",
  "ANNEXE",
  "ANNEXES",
  "BIBLIOGRAPHIE",
  "R\xC9F\xC9RENCES",
  "GLOSSAIRE",
  "R\xC9SUM\xC9",
  "ABSTRACT",
  "PR\xC9AMBULE",
  "PROFIL",
  "COMP\xC9TENCES",
  "EXP\xC9RIENCES",
  "EXP\xC9RIENCE",
  "FORMATION",
  "FORMATIONS",
  "PROJETS",
  "LANGUES",
  "INT\xC9R\xCATS",
  "DISTINCTIONS",
  "CERTIFICATIONS",
  "OUTILS",
  "SYST\xC8MES",
  "SP\xC9CIALIT\xC9S",
  "OBJECTIF",
  "MENTIONS",
  "IDENTIT\xC9",
  "COORDONN\xC9ES",
  "SUMMARY",
  "CONTENTS",
  "APPENDIX",
  "REFERENCES",
  "SKILLS",
  "EXPERIENCE",
  "EDUCATION",
  "PROJECTS",
  "LANGUAGES",
  "INTERESTS",
  "TOOLS",
  "AWARDS",
  "INHALT",
  "ZUSAMMENFASSUNG",
  "SPRACHEN",
  "KENNTNISSE",
  "BERUFSERFAHRUNG"
];
var ADMIN_KEEP = [
  "R\xC9PUBLIQUE FRAN\xC7AISE",
  "MINIST\xC8RE",
  "PR\xC9FECTURE",
  "SOUS-PR\xC9FECTURE",
  "MAIRIE",
  "ADMINISTRATION",
  "SERVICE PUBLIC",
  "GREFFE",
  "TRIBUNAL",
  "COUR",
  "ATTESTATION",
  "CERTIFICAT",
  "R\xC9C\xC9PISS\xC9",
  "FORMULAIRE",
  "BULLETIN",
  "EXTRAIT",
  "D\xC9CLARATION",
  "JUSTIFICATIF",
  "CONVOCATION",
  "NOTIFICATION",
  "AVIS",
  "N\xC9ANT",
  "SANS OBJET",
  "PI\xC8CE JOINTE",
  "ARTICLE",
  "ALIN\xC9A",
  "D\xC9CRET",
  "ARR\xCAT\xC9",
  "CODE",
  "LOI",
  "SIGNATURE",
  "CACHET",
  "Nom",
  "Pr\xE9nom",
  "Sexe",
  "Masculin",
  "F\xE9minin",
  "Date de naissance",
  "Lieu de naissance",
  "Nationalit\xE9",
  "Adresse",
  "D\xE9livr\xE9 le"
];
var PARCOURS_KEEP = [
  "Baccalaur\xE9at",
  "Licence",
  "Master",
  "Doctorat",
  "BUT",
  "BTS",
  "DUT",
  "CAP",
  "Dipl\xF4me",
  "Mention",
  "Promotion",
  "Cohorte",
  "Cohortes",
  "Sp\xE9cialit\xE9",
  "Sp\xE9cialit\xE9s",
  "Option",
  "G\xE9n\xE9ral",
  "Technologique",
  "Professionnel",
  "Alternance",
  "Apprentissage",
  "Stage",
  "Bachelor"
];
var ECOLE_KEEP = [
  "Pr\xE9pa",
  "Classe pr\xE9paratoire",
  "Semestre",
  "Trimestre",
  "M\xE9moire",
  "Th\xE8se",
  "Soutenance",
  "Rapport de stage",
  "Tuteur",
  "ECTS",
  "Cr\xE9dits",
  "Module",
  "Mati\xE8re",
  "Travaux dirig\xE9s",
  "Travaux pratiques",
  "Cours magistral",
  "Contr\xF4le continu",
  "Moyenne",
  "Coefficient",
  "Relev\xE9 de notes",
  "Coursework",
  "Dissertation",
  "Semester",
  "Transcript"
];
function defaultProfiles() {
  return [
    // « Vierge » reste VIDE, et doit le rester : c'est le profil qui ne
    // présuppose rien, donc le témoin quand on soupçonne qu'une liste blanche
    // cache un défaut de détection.
    { name: "Vierge", alwaysKeep: [], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: "D\xE9veloppeur / Tech", alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...TECH_KEEP, ...PUBLIC_KEEP, ...motsDeForme("cv")], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: "Administratif", alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...ADMIN_KEEP, ...motsDeForme("administratif")], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: "\xC9cole / \xC9tudes", alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...ECOLE_KEEP, ...motsDeForme("scolaire")], alwaysMask: [], disabledTypes: [], realistic: false },
    // ── PROFILS PAR FORMAT ──
    //
    // Les précédents décrivent un MÉTIER (« je suis développeur »), ceux-ci un
    // TYPE DE DOCUMENT (« ceci est un CV »). Les deux axes sont utiles et ne se
    // remplacent pas : un développeur qui envoie un relevé bancaire n'a pas
    // besoin de sa liste de frameworks, il a besoin des mots d'un relevé.
    //
    // Leur vocabulaire vient de `vocabulaire-formats.js`, la même source que la
    // reconnaissance de type — c'est ce qui permet de les PROPOSER
    // automatiquement (voir PROFIL_POUR_TYPE), et ce qui garantit qu'ajouter
    // une langue serve les deux d'un coup.
    { name: "CV / R\xE9sum\xE9", alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...PUBLIC_KEEP, ...motsDeForme("cv")], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: "Relev\xE9 bancaire", alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...motsDeForme("bancaire")], alwaysMask: [], disabledTypes: [], realistic: false },
    // Un document qui PARLE d'IA ou de plateformes n'est pas forcément un
    // document technique : ce profil sert le rédacteur, l'étudiant, le
    // chercheur — sans leur imposer la liste des frameworks.
    { name: "R\xE9daction / Recherche", alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...PUBLIC_KEEP, ...motsDeForme("scolaire")], alwaysMask: [], disabledTypes: [], realistic: false }
  ];
}
function normalizeProfile(p) {
  const arr = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  const out = {
    name: typeof p?.name === "string" && p.name.trim() ? p.name.trim() : "Sans nom",
    alwaysKeep: arr(p?.alwaysKeep),
    alwaysMask: arr(p?.alwaysMask),
    disabledTypes: arr(p?.disabledTypes),
    realistic: !!p?.realistic
  };
  if (typeof p?.empreinte === "string") out.empreinte = p.empreinte;
  return out;
}
function empreinteDe(profil) {
  const p = normalizeProfile(profil);
  const s = JSON.stringify([p.alwaysKeep, p.alwaysMask, p.disabledTypes, p.realistic]);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
var EMPREINTES_HISTORIQUES = {
  // 2cb8ce1c : jusqu'au 15/08/2026, avant les sigles de métier et l'outillage
  //            de test (commit 115b097).
  // 5a83db13 : jusqu'au 18/08/2026, avant l'ajout de STRUCTURE_KEEP.
  // 519521a4 : jusqu'au 02/09/2026, avant les mots de forme multilingues.
  "D\xE9veloppeur / Tech": ["2cb8ce1c", "5a83db13", "519521a4"],
  // Relevées AVANT modification, pour que la mise à jour atteigne aussi les
  // copies stockées à une époque où le champ `empreinte` n'existait pas encore.
  // Sans ça, elles seraient prises pour des versions éditées par l'utilisateur
  // et ne recevraient jamais l'espagnol ni le portugais.
  "Administratif": ["5ec436cb"],
  "\xC9cole / \xC9tudes": ["4a086a21"],
  "R\xE9daction / Recherche": ["a8805ca9", "f37a741c"],
  "Vierge": ["1727123c"]
};
function seedDefaults(existing, ecartes = []) {
  const list = (Array.isArray(existing) ? existing : []).map(normalizeProfile);
  const parNom = new Map(list.map((p) => [p.name, p]));
  const ecarte = new Set(Array.isArray(ecartes) ? ecartes : []);
  for (const d of defaultProfiles()) {
    if (ecarte.has(d.name) && !parNom.has(d.name)) continue;
    const courant = { ...d, empreinte: empreinteDe(d) };
    const stocke = parNom.get(d.name);
    if (!stocke) {
      list.push(courant);
      continue;
    }
    const actuelle = empreinteDe(stocke);
    const intact = stocke.empreinte ? stocke.empreinte === actuelle : (EMPREINTES_HISTORIQUES[d.name] || []).includes(actuelle);
    if (intact) list[list.indexOf(stocke)] = courant;
  }
  return list;
}
function hasStore() {
  return typeof chrome !== "undefined" && chrome.storage?.local;
}
async function loadProfiles() {
  if (!hasStore()) return seedDefaults([]);
  const r = await chrome.storage.local.get([PROFILES_KEY, PROFILES_ECARTES_KEY]).catch(() => ({}));
  const seeded = seedDefaults(r?.[PROFILES_KEY], r?.[PROFILES_ECARTES_KEY]);
  if (!r?.[PROFILES_KEY]) await chrome.storage.local.set({ [PROFILES_KEY]: seeded }).catch(() => {
  });
  return seeded;
}
async function lireEcartes() {
  if (!hasStore()) return [];
  const r = await chrome.storage.local.get(PROFILES_ECARTES_KEY).catch(() => ({}));
  const v = r?.[PROFILES_ECARTES_KEY];
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}
async function ecrireEcartes(noms) {
  if (!hasStore()) return;
  await chrome.storage.local.set({ [PROFILES_ECARTES_KEY]: [...new Set(noms)] }).catch(() => {
  });
}
function estProfilLivre(name) {
  return defaultProfiles().some((d) => d.name === name);
}
async function saveAllProfiles(list) {
  if (!hasStore()) return;
  await chrome.storage.local.set({ [PROFILES_KEY]: list.map(normalizeProfile) }).catch(() => {
  });
}
async function upsertProfile(profile) {
  const list = await loadProfiles();
  const p = normalizeProfile(profile);
  const idx = list.findIndex((x) => x.name === p.name);
  if (idx >= 0) list[idx] = p;
  else list.push(p);
  await saveAllProfiles(list);
  if (estProfilLivre(p.name)) {
    const restants = (await lireEcartes()).filter((n) => n !== p.name);
    await ecrireEcartes(restants);
  }
  return list;
}
async function deleteProfile(name) {
  const list = (await loadProfiles()).filter((p) => p.name !== name);
  await saveAllProfiles(list);
  if (estProfilLivre(name)) await ecrireEcartes([...await lireEcartes(), name]);
  return list;
}
var PROFIL_POUR_TYPE = {
  cv: "CV / R\xE9sum\xE9",
  administratif: "Administratif",
  scolaire: "\xC9cole / \xC9tudes",
  bancaire: "Relev\xE9 bancaire",
  email: null
};

// src/popup/i18n.js
var msg = (cle, sub) => (typeof chrome !== "undefined" && chrome.i18n?.getMessage ? chrome.i18n.getMessage(cle, sub) : "") || cle;
var ATTRIBUTS = [
  ["i18nTitle", "title"],
  ["i18nPlaceholder", "placeholder"],
  ["i18nAria", "aria-label"],
  // `alt` porte le NOM ACCESSIBLE des boutons-images (Copier, Télécharger) :
  // le mot y est cuit dans le bitmap, donc invisible autrement. Sans cette
  // ligne, ces boutons resteraient en français pour un lecteur d'écran anglais.
  ["i18nAlt", "alt"]
];
function appliquerTraductions(racine = document) {
  for (const el of racine.querySelectorAll("[data-i18n]")) {
    el.textContent = msg(el.dataset.i18n);
  }
  for (const el of racine.querySelectorAll("[data-i18n-html]")) {
    el.innerHTML = msg(el.dataset.i18nHtml);
  }
  for (const [prop, attr] of ATTRIBUTS) {
    for (const el of racine.querySelectorAll(`[data-${attr === "aria-label" ? "i18n-aria" : "i18n-" + attr}]`)) {
      el.setAttribute(attr, msg(el.dataset[prop]));
    }
  }
  document.documentElement.lang = typeof chrome !== "undefined" && chrome.i18n?.getUILanguage?.().slice(0, 2) || "fr";
}

// src/popup/poids.js
var NIVEAUX = {
  leger: { libelle: "L\xE9ger", classe: "poids-leger" },
  moyen: { libelle: "Moyen", classe: "poids-moyen" },
  lourd: { libelle: "Lourd", classe: "poids-lourd" },
  tresLourd: { libelle: "Tr\xE8s lourd", classe: "poids-tres-lourd" }
};
var SEUILS_PAGES = [
  [8, "leger"],
  [25, "moyen"],
  [60, "lourd"]
];
var SEUILS_CARACTERES = [
  [15e3, "leger"],
  [6e4, "moyen"],
  [15e4, "lourd"]
];
var SEUILS_OCTETS = [
  [40 * 1024, "leger"],
  [200 * 1024, "moyen"],
  [800 * 1024, "lourd"]
];
function classer(valeur, seuils) {
  for (const [max, cle] of seuils) if (valeur <= max) return cle;
  return "tresLourd";
}
var SANS_TEXTE = /* @__PURE__ */ new Set(["jpg", "jpeg", "png", "webp"]);
function poidsDeTraitement({ ext, taille = 0, pages = null, caracteres = null }) {
  const e = (ext || "").toLowerCase();
  if (SANS_TEXTE.has(e)) return { cle: "leger", ...NIVEAUX.leger, base: "image" };
  if (pages != null) {
    return { cle: classer(pages, SEUILS_PAGES), ...NIVEAUX[classer(pages, SEUILS_PAGES)], base: "pages" };
  }
  if (caracteres != null) {
    const cle2 = classer(caracteres, SEUILS_CARACTERES);
    return { cle: cle2, ...NIVEAUX[cle2], base: "caracteres" };
  }
  const cle = classer(taille, SEUILS_OCTETS);
  return { cle, ...NIVEAUX[cle], base: "octets" };
}
function expliquerPoids(poids) {
  switch (poids.base) {
    case "image":
      return "Une image n\u2019a pas de texte \xE0 analyser : seules les m\xE9tadonn\xE9es sont retir\xE9es.";
    case "pages":
      return "Estim\xE9 d\u2019apr\xE8s le nombre de pages. Ce qui compte est la quantit\xE9 de texte, pas le poids du fichier.";
    case "caracteres":
      return "Estim\xE9 d\u2019apr\xE8s la quantit\xE9 de texte \xE0 analyser.";
    default:
      return "Estim\xE9 d\u2019apr\xE8s la taille du fichier \u2014 approximatif pour ce format, dont le texte est compress\xE9.";
  }
}

// src/popup/termes.js
var SEPARATEURS = /[,;\t\r\n]+/;
function parseTermes(valeur) {
  return (valeur || "").split(SEPARATEURS).map((s) => s.trim()).filter(Boolean);
}
function ajouterTerme(valeur, terme) {
  const t = (terme || "").trim();
  if (!t) return valeur || "";
  const existants = parseTermes(valeur);
  if (existants.includes(t)) return valeur || "";
  return [...existants, t].join(", ");
}

// src/engine/pseudonyms.js
var LOCALES = {
  fr: {
    prenoms: [
      "Alexandre",
      "Antoine",
      "Baptiste",
      "Cl\xE9ment",
      "\xC9tienne",
      "Gabriel",
      "Hugo",
      "Jules",
      "Louis",
      "Lucas",
      "Maxime",
      "Nathan",
      "Paul",
      "Rapha\xEBl",
      "Romain",
      "Thomas",
      "Victor",
      "Julien",
      "Quentin",
      "Vincent",
      "Am\xE9lie",
      "Camille",
      "Charlotte",
      "Chlo\xE9",
      "\xC9lise",
      "Emma",
      "In\xE8s",
      "Juliette",
      "L\xE9a",
      "Louise",
      "Lucie",
      "Manon",
      "Mathilde",
      "No\xE9mie",
      "Pauline",
      "Marion",
      "H\xE9l\xE8ne",
      "Nathalie",
      "Aur\xE9lie",
      "\xC9milie"
    ],
    noms: [
      "Bernard",
      "Blanc",
      "Bonnet",
      "Chevalier",
      "Deschamps",
      "Dubois",
      "Dumont",
      "Durand",
      "Faure",
      "Fournier",
      "Garnier",
      "Gauthier",
      "Girard",
      "Lambert",
      "Lefebvre",
      "Legrand",
      "Lemaire",
      "Mercier",
      "Moreau",
      "Morel",
      "Petit",
      "Renard",
      "Richard",
      "Robin",
      "Rousseau",
      "Roux",
      "Simon",
      "Barbier",
      "Boyer",
      "Brun",
      "Colin",
      "Denis",
      "Leroy",
      "Perrin"
    ],
    villes: [
      "Paris",
      "Lyon",
      "Marseille",
      "Toulouse",
      "Bordeaux",
      "Lille",
      "Nantes",
      "Strasbourg",
      "Nice",
      "Montpellier",
      "Rennes",
      "Reims",
      "Grenoble",
      "Dijon",
      "Angers",
      "Tours",
      "Orl\xE9ans",
      "Metz"
    ],
    orgs: [
      "Nordis Conseil",
      "Alphatec",
      "Groupe Verti\xE8re",
      "Solunea",
      "Castel & Fils",
      "Novaris SARL",
      "Ateliers Brossard",
      "Delmont Industries",
      "Cabinet Ferrand",
      "Tessalis",
      "Ormeau Digital",
      "Clavier & Associ\xE9s",
      "Sequoia Services",
      "Baltane",
      "Comptoir Lorrain",
      "Studio Amarante"
    ],
    rues: [
      "rue des Acacias",
      "avenue des Peupliers",
      "boulevard Saint-Michel",
      "rue de la Fontaine",
      "impasse des Lilas",
      "chemin des Vignes",
      "place du March\xE9",
      "rue des \xC9coles",
      "avenue de la R\xE9publique",
      "rue du Moulin",
      "all\xE9e des Charmes",
      "quai des Brumes"
    ],
    emailDomains: ["exemple-mail.fr", "courriel-temp.fr", "boite-anonyme.fr", "pseudo-mail.fr"],
    mois: [
      "janvier",
      "f\xE9vrier",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "ao\xFBt",
      "septembre",
      "octobre",
      "novembre",
      "d\xE9cembre"
    ],
    phone: (h2, i) => {
      const digitsAt = (hh, n) => String(hh % 10 ** n).padStart(n, "0");
      const d = digitsAt(h2 + i * 104729 >>> 0, 8);
      const prefix = (h2 + i) % 2 === 0 ? "06" : "07";
      return `${prefix} ${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)}`;
    }
  },
  en: {
    prenoms: [
      "James",
      "John",
      "Robert",
      "Michael",
      "William",
      "David",
      "Daniel",
      "Matthew",
      "Andrew",
      "Joseph",
      "Henry",
      "Samuel",
      "Benjamin",
      "Oliver",
      "Jack",
      "Thomas",
      "Charles",
      "George",
      "Edward",
      "Nathan",
      "Mary",
      "Jennifer",
      "Elizabeth",
      "Susan",
      "Jessica",
      "Sarah",
      "Karen",
      "Emma",
      "Olivia",
      "Emily",
      "Charlotte",
      "Grace",
      "Hannah",
      "Alice",
      "Rachel",
      "Laura",
      "Amy",
      "Claire",
      "Victoria",
      "Sophie"
    ],
    noms: [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Miller",
      "Davis",
      "Wilson",
      "Anderson",
      "Taylor",
      "Thomas",
      "Moore",
      "Jackson",
      "Martin",
      "Lee",
      "Walker",
      "Hall",
      "Allen",
      "Young",
      "King",
      "Wright",
      "Scott",
      "Green",
      "Baker",
      "Adams",
      "Nelson",
      "Carter",
      "Mitchell",
      "Roberts",
      "Turner",
      "Phillips",
      "Campbell",
      "Parker"
    ],
    villes: [
      "London",
      "Manchester",
      "Birmingham",
      "Leeds",
      "Bristol",
      "Liverpool",
      "New York",
      "Boston",
      "Chicago",
      "Austin",
      "Seattle",
      "Denver",
      "Toronto",
      "Vancouver",
      "Dublin",
      "Edinburgh",
      "Cardiff",
      "Glasgow"
    ],
    orgs: [
      "Northbridge Consulting",
      "Alphatech Ltd",
      "Verti\xE8re Group",
      "Solunea Inc",
      "Castel & Co",
      "Novaris Partners",
      "Brossard Studios",
      "Delmont Industries",
      "Ferrand Associates",
      "Tessalis",
      "Ormeau Digital",
      "Sequoia Services",
      "Baltane Corp",
      "Amarante Studio",
      "Fenwick & Partners",
      "Harlow Digital"
    ],
    rues: [
      "Acacia Street",
      "Poplar Avenue",
      "Saint Michael Boulevard",
      "Fountain Road",
      "Lilac Court",
      "Vineyard Lane",
      "Market Square",
      "School Street",
      "Republic Avenue",
      "Mill Road",
      "Elm Way",
      "Harbour Drive"
    ],
    emailDomains: ["example-mail.com", "temp-inbox.com", "anon-mailbox.com", "pseudo-mail.com"],
    mois: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ],
    phone: (h2, i) => {
      const digitsAt = (hh, n) => String(hh % 10 ** n).padStart(n, "0");
      const area = 200 + (h2 + i) % 700;
      const d = digitsAt(h2 + i * 104729 >>> 0, 7);
      return `(${area}) ${d.slice(0, 3)}-${d.slice(3, 7)}`;
    }
  }
};
var REALISTIC_TYPES = /* @__PURE__ */ new Set([
  "PER",
  "ORG",
  "LOC",
  "ADRESSE",
  "EMAIL",
  "TELEPHONE",
  "DATE_NAISSANCE",
  // Handle : identifiant, détecté par regex donc de façon déterministe.
  "PSEUDO"
]);
var stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
function createPseudonymizer({ seed = "clarence", avoid = () => false, locale = "fr" } = {}) {
  const L = LOCALES[locale] || LOCALES.fr;
  const used = /* @__PURE__ */ new Set();
  const fnv = (str) => {
    let h = 2166136261;
    for (const c of seed + " " + str) {
      h ^= c.codePointAt(0);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  };
  const pick = (arr, h, i = 0) => arr[(h + i * 13) % arr.length];
  function unique(gen, h) {
    for (let i = 0; i < 300; i++) {
      const v = gen(h, i);
      if (v && !used.has(v) && !avoid(v)) {
        used.add(v);
        return v;
      }
    }
    return null;
  }
  const tokenMap = /* @__PURE__ */ new Map();
  const estConserve = estComposantNonIdentifiant;
  const applyCase = (pseudo, original) => original === original.toUpperCase() && new RegExp("\\p{L}{2}", "u").test(original) ? pseudo.toUpperCase() : pseudo;
  function pseudoToken(token, rang, total) {
    const isLast = rang === total - 1;
    if (estConserve(token, rang, total)) return token;
    const key = token.toLowerCase();
    if (tokenMap.has(key)) return applyCase(tokenMap.get(key), token);
    const estPatronyme = total > 1 ? isLast : token === token.toUpperCase() && new RegExp("\\p{L}{2}", "u").test(token);
    const pool = estPatronyme ? L.noms : L.prenoms;
    const v = unique((h2, i) => pick(pool, h2, i), fnv("PER_TOKEN:" + key));
    if (!v) return null;
    tokenMap.set(key, v);
    return applyCase(v, token);
  }
  const composeIdentifiant = (brut) => {
    const parts = String(brut).split(/([._\-]+)/);
    const mots = parts.filter((p, i) => i % 2 === 0 && p);
    if (!mots.length) return null;
    let out = "";
    let rang = 0;
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        out += parts[i];
        continue;
      }
      if (!parts[i]) continue;
      const p = pseudoToken(parts[i], rang, mots.length);
      if (!p) return null;
      out += stripAccents(p);
      rang++;
    }
    return out || null;
  };
  const generators = {
    // Composition composant par composant (voir tokenMap ci-dessus). Les
    // séparateurs d'origine (espaces, traits d'union) sont préservés pour que
    // « Marc-Antoine » reste un composé à trait d'union.
    PER: (h, original) => {
      const parts = String(original).split(/([\s\-]+)/);
      const mots = parts.filter((p, i) => i % 2 === 0 && p);
      if (!mots.length) return null;
      let out = "";
      let rang = 0;
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) {
          out += parts[i];
          continue;
        }
        if (!parts[i]) continue;
        const p = pseudoToken(parts[i], rang, mots.length);
        if (!p) return null;
        out += p;
        rang++;
      }
      return !avoid(out) ? out : null;
    },
    ORG: (h) => unique((h2, i) => pick(L.orgs, h2, i), h),
    // Un générateur ETABLISSEMENT vivait ici (15/08 → 18/08). Il conservait le
    // mot d'institution d'origine — « Lycée Camille-Claudel » → « Lycée
    // Rousseau » — pour qu'un lycée ne devienne pas une université, et
    // reprenait la position du mot sur l'original plutôt que sur la locale
    // (« Westfield College » → « Boyer College »). Retiré avec le type
    // lui-même : voir REALISTIC_TYPES. Récupérable tel quel dans l'historique
    // si la détection des établissements devient un jour fiable.
    LOC: (h) => unique((h2, i) => pick(L.villes, h2, i), h),
    ADRESSE: (h) => unique((h2, i) => `${(h2 + i * 7) % 98 + 1} ${pick(L.rues, h2 >>> 3, i)}`, h),
    // La partie locale reprend les composants du nom quand elle en porte —
    // c'est le cas courant — et l'unicité se joue alors sur le domaine.
    EMAIL: (h, original) => unique((h2, i) => {
      const local = composeIdentifiant(String(original).split("@")[0]);
      const repli = `${stripAccents(pick(L.prenoms, h2, i))}.${stripAccents(pick(L.noms, (h2 >>> 7) + i, i))}`;
      return `${local || repli}@${pick(L.emailDomains, h2 >>> 11, i)}`;
    }, h),
    // Handle (GitHub, LinkedIn…). IDENTIFIANT, et sa détection est
    // DÉTERMINISTE (regex-detect.js) : les deux conditions de REALISTIC_TYPES
    // sont remplies. Il sortait en « [PSEUDO_1] » faute d'avoir été branché.
    PSEUDO: (h, original) => unique((h2, i) => composeIdentifiant(original) || `${stripAccents(pick(L.prenoms, h2, i))}${stripAccents(pick(L.noms, (h2 >>> 5) + i, i))}`, h),
    TELEPHONE: (h) => unique((h2, i) => L.phone(h2, i), h),
    // Le FORMAT d'origine est reproduit, pas seulement la nature de la donnée :
    // « january 1 2002 » devenait « 13/10/1976 », ce qui saute aux yeux au
    // milieu d'un texte anglais et trahit le passage de l'outil.
    DATE_NAISSANCE: (h, original) => unique((h2, i) => {
      const j = (h2 + i) % 28 + 1;
      const m = ((h2 >>> 4) + i) % 12 + 1;
      const a = 1965 + ((h2 >>> 9) + i) % 40;
      const litteral = new RegExp("\\p{L}{3}", "u").test(original);
      if (litteral) {
        const nom = L.mois[m - 1];
        const source = original.match(new RegExp("\\p{L}{3,}", "u"))?.[0] || "";
        const moisCase = source === source.toUpperCase() ? nom.toUpperCase() : source[0] === source[0].toLowerCase() ? nom.toLowerCase() : nom;
        return locale === "en" ? `${moisCase} ${j} ${a}` : `${j} ${moisCase} ${a}`;
      }
      const sep = original.includes("-") ? "-" : "/";
      return `${String(j).padStart(2, "0")}${sep}${String(m).padStart(2, "0")}${sep}${a}`;
    }, h)
  };
  return function pseudonymFor(type, value) {
    if (!REALISTIC_TYPES.has(type)) return null;
    const gen = generators[type];
    if (!gen) return null;
    return gen(fnv(type + ":" + value), value);
  };
}

// src/popup/identity.js
var IDENTITY_KEY = "clarenceIdentity";
var IDENTITY_ESSENTIELS = /* @__PURE__ */ new Set(["prenom", "nom"]);
var IDENTITY_FIELDS = [
  ["prenom", "Pr\xE9nom(s)"],
  ["nom", "Nom(s) de famille"],
  ["emails", "Emails"],
  ["telephones", "T\xE9l\xE9phones"],
  ["adresse", "Adresse postale"],
  ["ville", "Ville"],
  ["dateNaissance", "Date de naissance"],
  ["employeurs", "Employeur(s), entreprise(s)"],
  ["ecoles", "\xC9cole(s), universit\xE9(s)"],
  ["pseudos", "Pseudos, handles (GitHub, LinkedIn\u2026)"],
  ["autres", "Autres termes \xE0 toujours masquer"]
];
var splitLines = (v) => String(v ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
function normalizeIdentity(raw) {
  const champs = {};
  for (const [key] of IDENTITY_FIELDS) {
    champs[key] = splitLines(Array.isArray(raw?.champs?.[key]) ? raw.champs[key].join("\n") : raw?.champs?.[key]);
  }
  const status = ["configur\xE9", "refus\xE9"].includes(raw?.status) ? raw.status : "neuf";
  return { status, champs };
}
var MIN_TERM_LENGTH = 2;
function identityTerms(identity) {
  const { champs } = normalizeIdentity(identity);
  const vus = /* @__PURE__ */ new Set();
  const out = [];
  for (const [key] of IDENTITY_FIELDS) {
    for (const terme of champs[key]) {
      if (terme.length < MIN_TERM_LENGTH) continue;
      const k = terme.toLowerCase();
      if (vus.has(k)) continue;
      vus.add(k);
      out.push(terme);
    }
  }
  return out;
}
var CHAMPS_DECOMPOSABLES = ["prenom", "nom"];
function composantsDeNom(identity) {
  const { champs } = normalizeIdentity(identity);
  const out = [];
  for (const cle of CHAMPS_DECOMPOSABLES) {
    for (const terme of champs[cle]) {
      const parts = terme.split(/\s+/).filter(Boolean);
      if (parts.length < 2) continue;
      parts.forEach((p, i) => {
        if (p.length < MIN_TERM_LENGTH) return;
        if (estComposantNonIdentifiant(p, i, parts.length)) return;
        out.push(p);
      });
    }
  }
  return out;
}
function caseVariants(terme) {
  const title = terme.replace(
    new RegExp("\\p{L}[\\p{L}'\u2019-]*", "gu"),
    (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()
  );
  return [terme, terme.toUpperCase(), terme.toLowerCase(), title];
}
function identitySearchTerms(identity) {
  const vus = /* @__PURE__ */ new Set();
  const out = [];
  for (const terme of [...identityTerms(identity), ...composantsDeNom(identity)]) {
    for (const v of caseVariants(terme)) {
      if (vus.has(v)) continue;
      vus.add(v);
      out.push(v);
    }
  }
  return out;
}
function hasStore2() {
  return typeof chrome !== "undefined" && chrome.storage?.local;
}
async function loadIdentity() {
  if (!hasStore2()) return normalizeIdentity(null);
  const r = await chrome.storage.local.get(IDENTITY_KEY).catch(() => ({}));
  return normalizeIdentity(r?.[IDENTITY_KEY]);
}
async function saveIdentity(identity) {
  if (!hasStore2()) return;
  await chrome.storage.local.set({ [IDENTITY_KEY]: normalizeIdentity(identity) }).catch(() => {
  });
}
async function clearIdentity() {
  if (!hasStore2()) return;
  await chrome.storage.local.remove(IDENTITY_KEY).catch(() => {
  });
}

// src/popup/main.js
var currentText = "";
var autoEntities = [];
var manualEntities = [];
var removedKeys = /* @__PURE__ */ new Set();
var disabledTypes = new Set(TYPES_PEU_FIABLES);
var TYPE_DISPLAY = {
  PER: msg("type_per"),
  ORG: msg("type_org"),
  LOC: msg("type_loc"),
  EMAIL: msg("type_email"),
  TELEPHONE: msg("type_telephone"),
  IBAN: "IBAN",
  CARTE_BANCAIRE: msg("type_carte"),
  NIR: "NIR",
  SIRET_SIREN: "SIRET/SIREN",
  CODE_POSTAL_VILLE: msg("type_code_postal"),
  MONTANT: msg("type_montant"),
  ADRESSE: msg("type_adresse"),
  DATE_NAISSANCE: msg("type_date_naissance"),
  REFERENCE: msg("type_reference"),
  IP: "IP",
  MAC: "MAC",
  BIC: "BIC",
  PSEUDO: msg("type_pseudo"),
  DATE: msg("type_date"),
  ID_NATIONAL: msg("type_id_national"),
  // Apportés par la détection zero-shot. Décocher un de ces types SAUTE
  // l'inférence correspondante (voir GROUPES dans engine/gliner.js) : on ne
  // paie que ce qu'on demande.
  POSTE: msg("type_poste"),
  NATIONALITE: msg("type_nationalite"),
  ETABLISSEMENT: msg("type_etablissement"),
  SANTE: msg("type_sante"),
  MISC: msg("type_divers"),
  PERSONNALISE: "Perso"
};
var parseLines = parseTermes;
var APERCUS_TERMES = [
  ["docKeep", "docKeepLus"],
  ["docMask", "docMaskLus"],
  ["fileAlwaysKeep", "fileAlwaysKeepLus"],
  ["fileAlwaysMask", "fileAlwaysMaskLus"]
];
function rendreApercuTermes() {
  for (const [idChamp, idApercu] of APERCUS_TERMES) {
    const champ = $(idChamp), apercu = $(idApercu);
    if (!champ || !apercu) continue;
    const termes = parseTermes(champ.value);
    apercu.textContent = termes.length ? `${termes.length} terme${termes.length > 1 ? "s" : ""} : ${termes.join(" \xB7 ")}` : "";
  }
}
var nerPipe = null;
var nerLoading = false;
var pseudoSeed = Math.random().toString(36).slice(2);
function maskOptions() {
  if (!$("realisticToggle")?.checked) return {};
  return {
    pseudonymize: createPseudonymizer({
      seed: pseudoSeed,
      // anti-collision : jamais un pseudo déjà présent dans le texte réel
      avoid: (v) => currentText.includes(v),
      locale: $("pseudoLocale")?.value || "fr"
    })
  };
}
var lastMapping = [];
var lastReinjected = "";
var overlayKind = null;
chrome.storage?.session?.get("clarenceMapping").then((r) => {
  if (Array.isArray(r?.clarenceMapping) && r.clarenceMapping.length && !lastMapping.length) {
    lastMapping = r.clarenceMapping;
  }
}).catch(() => {
});
var $ = (id) => document.getElementById(id);
appliquerTraductions();
if (new URLSearchParams(location.search).has("panel")) {
  document.body.classList.add("panel-mode");
  document.documentElement.classList.add("panel-mode");
  if (window.parent === window) document.body.classList.add("autonome");
  document.documentElement.style.background = "#FFFAF2";
  const shell = document.querySelector(".popup-shell");
  const announce = () => window.parent.postMessage(
    { clarencePanelHeight: shell.offsetHeight },
    "*"
  );
  new ResizeObserver(announce).observe(shell);
  window.addEventListener("load", announce);
  document.addEventListener("toggle", () => {
    announce();
    setTimeout(announce, 0);
  }, true);
}
var keyOf = entityKey;
var esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function activeEntities() {
  const forced = forcedMasks(
    currentText,
    [...parseLines($("alwaysMask")?.value), ...identityForceTerms()]
  );
  const sel = selectActive(autoEntities, [...manualEntities, ...forced], removedKeys);
  return filterByRules(sel, { disabledTypes, keepValues: parseLines($("alwaysKeep")?.value) });
}
function renderTypeChips(boxId, disabledSet) {
  const box = $(boxId);
  if (!box) return;
  box.innerHTML = Object.entries(TYPE_DISPLAY).filter(([t]) => t !== "PERSONNALISE").map(([t, label]) => {
    const off = disabledSet.has(t);
    return `<label class="type-chip ${off ? "off" : ""}"><input type="checkbox" data-type="${t}" ${off ? "" : "checked"}><span class="square-checkbox" aria-hidden="true"></span><span class="checkbox-label-text">${esc(label)}</span></label>`;
  }).join("");
}
renderTypeChips("typeToggles", disabledTypes);
function annotateHTML(text, entities) {
  let html = "";
  let cursor = 0;
  for (const e of entities) {
    html += esc(text.slice(cursor, e.start));
    html += `<mark class="src-${e.source}" data-key="${keyOf(e)}" title="${e.type} \u2014 clic pour retirer">${esc(e.value)}</mark>`;
    cursor = e.end;
  }
  html += esc(text.slice(cursor));
  return html;
}
var PREVIEW_LIMIT = 500;
function clipToLimit(text, entities, limit) {
  if (text.length <= limit) return { text, entities, truncated: false };
  const clipped = text.slice(0, limit);
  const kept = [];
  for (const e of entities) {
    if (e.start >= limit) break;
    kept.push(e.end <= limit ? e : { ...e, end: limit, value: text.slice(e.start, limit) });
  }
  return { text: clipped, entities: kept, truncated: true };
}
function overlayContentFor(kind) {
  if (kind === "annotated") {
    return { title: msg("detections_completes"), html: annotateHTML(currentText, activeEntities()) };
  }
  if (kind === "masked") {
    const { masked } = maskText(currentText, activeEntities(), maskOptions());
    return { title: msg("texte_propre_complet"), text: masked, copy: () => navigator.clipboard.writeText(masked) };
  }
  if (kind === "reinjected") {
    return { title: msg("reponse_desanonymisee_complete"), text: lastReinjected, copy: () => navigator.clipboard.writeText(lastReinjected) };
  }
  return null;
}
function openOverlay(kind) {
  const data = overlayContentFor(kind);
  if (!data) return;
  overlayKind = kind;
  $("overlayTitle").textContent = data.title;
  if (data.html != null) $("overlayBody").innerHTML = data.html;
  else $("overlayBody").textContent = data.text;
  $("overlayCopyBtn").hidden = !data.copy;
  $("overlayCopyBtn").onclick = data.copy || null;
  $("overlay").hidden = false;
}
function closeOverlay() {
  overlayKind = null;
  $("overlay").hidden = true;
}
function refreshOverlayIfOpen() {
  if (overlayKind) openOverlay(overlayKind);
}
function render() {
  const entities = activeEntities();
  $("results").hidden = false;
  $("textOptions").hidden = false;
  $("reinjectSection").hidden = false;
  renderTypeChips("typeToggles", disabledTypes);
  const annPreview = clipToLimit(currentText, entities, PREVIEW_LIMIT);
  $("annotated").innerHTML = annotateHTML(annPreview.text, annPreview.entities) + (annPreview.truncated ? "\u2026" : "");
  $("annotatedMoreBtn").hidden = !annPreview.truncated;
  const { masked, mapping } = maskText(currentText, entities, maskOptions());
  const maskedTruncated = masked.length > PREVIEW_LIMIT;
  $("masked").textContent = maskedTruncated ? masked.slice(0, PREVIEW_LIMIT) + "\u2026" : masked;
  $("maskedMoreBtn").hidden = !maskedTruncated;
  lastMapping = mapping;
  chrome.storage?.session?.set({ clarenceMapping: mapping }).catch(() => {
  });
  $("mappingWrap").innerHTML = mapping.length ? `<table>${mapping.map(
    (m) => `<tr><td class="mono">${esc(m.placeholder)}</td><td class="mono">${esc(m.value)}</td></tr>`
  ).join("")}</table>` : `<p>${msg("aucun_masque_actif")}</p>`;
  $("status").textContent = entities.length ? `${entities.length} \xE9l\xE9ment(s) masqu\xE9(s).` : msg("rien_detecte");
  $("status").className = "status";
  refreshOverlayIfOpen();
}
var MAX_INPUT = 8e3;
var ACCELERATEUR = "webgpu";
var GLINER_MODEL_URL = glinerModelUrl();
var nerWorker = null;
var nerReqId = 0;
var nerEngine = null;
var nerPending = /* @__PURE__ */ new Map();
function createNerWorker() {
  const worker = new Worker(chrome.runtime.getURL("popup/ner-worker.js"), { type: "module" });
  worker.addEventListener("message", (ev) => {
    const msg2 = ev.data || {};
    if (msg2.type === "progress" && msg2.total) {
      const pct = Math.round(msg2.loaded / msg2.total * 100);
      setStatus(`Mod\xE8le\u2026 ${pct} %`);
      const ratio = msg2.loaded / msg2.total;
      if (!$("fileMode")?.hidden) avancerEtape("detection", ratio);
      else setTextProgress(ratio);
      return;
    }
    if (msg2.type === "result" || msg2.type === "error" && msg2.id != null) {
      const p = nerPending.get(msg2.id);
      if (!p) return;
      nerPending.delete(msg2.id);
      msg2.type === "result" ? p.resolve(msg2.spansBatch ?? msg2.spans ?? msg2.tokens ?? msg2.flux) : p.reject(new Error(msg2.message));
    }
  });
  return worker;
}
function startEngine(engine) {
  const worker = createNerWorker();
  return new Promise((resolve, reject) => {
    const onInit = (ev) => {
      const msg2 = ev.data || {};
      if (msg2.type === "ready") {
        worker.removeEventListener("message", onInit);
        resolve(worker);
      } else if (msg2.type === "error" && msg2.id == null) {
        worker.removeEventListener("message", onInit);
        worker.terminate();
        reject(new Error(msg2.message));
      }
    };
    worker.addEventListener("message", onInit);
    worker.addEventListener("error", (e) => {
      worker.terminate();
      reject(new Error(e.message || "worker de d\xE9tection indisponible"));
    });
    worker.postMessage({
      type: "init",
      engine,
      wasmPath: chrome.runtime.getURL("vendor/"),
      model: engine === "gliner" ? GLINER_MODEL : NER_MODEL,
      modelUrl: engine === "gliner" ? GLINER_MODEL_URL : null,
      accelerateur: ACCELERATEUR
    });
  });
}
async function ensureNER() {
  if (nerPipe || nerLoading) return;
  nerLoading = true;
  setStatus(msg("etat_chargement_modele"));
  try {
    let worker = null;
    try {
      worker = await startEngine("gliner");
      nerEngine = "gliner";
    } catch (err) {
      console.warn("GLiNER indisponible, repli sur le NER BERT :", err);
      worker = await startEngine("bert");
      nerEngine = "bert";
    }
    nerWorker = worker;
    const envoyer = (charge) => new Promise((resolve, reject) => {
      if (!nerWorker) return reject(new OperationAnnulee());
      const id = ++nerReqId;
      nerPending.set(id, { resolve, reject });
      nerWorker.postMessage({ type: "run", id, ...charge });
    });
    nerPipe = nerEngine === "gliner" ? createBatchedPipeline((texts, labels) => envoyer({ texts, labels })) : (text, labels) => envoyer({ text, labels });
  } catch (err) {
    console.error("[clarence]", err);
  } finally {
    nerLoading = false;
  }
}
var compressionInfo = null;
var compressionEchouee = null;
function crochetCompression() {
  if (!$("fileCompress")?.checked || !compressionWorker) return null;
  const taux = Number($("fileCompressTaux")?.value || 0.5);
  let fait = 0;
  return async (segments, info) => {
    fait++;
    if (info?.total) await compressionProgress({ fait, total: info.total });
    try {
      const r = await compresserSegments(segments, compressionPipeline(), { taux });
      compressionInfo = {
        avant: (compressionInfo?.avant || 0) + r.tokensAvant,
        apres: (compressionInfo?.apres || 0) + r.tokensApres
      };
      return r.segments;
    } catch (err) {
      console.error("[clarence] compression interrompue :", err);
      compressionEchouee = compressionEchouee || String(err?.message || err);
      return segments;
    }
  };
}
var compressionWorker = null;
var compressionReqId = 0;
var compressionPending = /* @__PURE__ */ new Map();
async function ensureCompression() {
  if (compressionWorker) return { ok: true };
  const worker = new Worker(chrome.runtime.getURL("popup/compression-worker.js"), { type: "module" });
  worker.addEventListener("message", (ev) => {
    const msg2 = ev.data || {};
    if (msg2.type === "progress" && msg2.total) {
      const pct = Math.round(msg2.loaded / msg2.total * 100);
      fileSetStatus(`Mod\xE8le de compression\u2026 ${pct} %`);
      return;
    }
    if (msg2.id == null) return;
    const p = compressionPending.get(msg2.id);
    if (!p) return;
    compressionPending.delete(msg2.id);
    msg2.type === "result" ? p.resolve(msg2.flux) : p.reject(new Error(msg2.message));
  });
  const issue = await new Promise((resolve) => {
    const onReady = (ev) => {
      const msg2 = ev.data || {};
      if (msg2.type === "compressionReady") {
        worker.removeEventListener("message", onReady);
        resolve({ ok: true });
      } else if (msg2.type === "error" && msg2.id == null) {
        worker.removeEventListener("message", onReady);
        console.error("[clarence] compression indisponible :", msg2.message);
        worker.terminate();
        resolve({ ok: false, message: msg2.message });
      }
    };
    const minuteur = setTimeout(() => {
      worker.removeEventListener("message", onReady);
      worker.terminate();
      resolve({ ok: false, message: "d\xE9lai d\xE9pass\xE9 au chargement du mod\xE8le" });
    }, 18e4);
    worker.addEventListener("message", onReady);
    worker.postMessage({
      type: "initCompression",
      wasmPath: chrome.runtime.getURL("vendor/"),
      model: COMPRESSION_MODEL
    });
    const stop = () => clearTimeout(minuteur);
    worker.addEventListener("message", stop, { once: true });
  });
  if (issue.ok) compressionWorker = worker;
  return issue;
}
var compressionPipeline = () => (texte) => new Promise((resolve, reject) => {
  if (!compressionWorker) return reject(new Error("compression non charg\xE9e"));
  const id = ++compressionReqId;
  compressionPending.set(id, { resolve, reject });
  compressionWorker.postMessage({ type: "compress", id, text: texte });
});
function purgerWorkerNer(raison) {
  for (const p of nerPending.values()) p.reject(raison);
  nerPending.clear();
  if (nerWorker) nerWorker.terminate();
  nerWorker = null;
  nerPipe = null;
  nerEngine = null;
  nerLoading = false;
}
function contextualDetector() {
  return nerEngine === "gliner" ? detectGliner : detectNER;
}
function arbitreContextuel() {
  if (nerEngine !== "gliner") return void 0;
  return composerArbitre(nerPipe, arbitrerFauxPositifs);
}
function detectContextual(text, opts = {}) {
  if (!nerPipe) return [];
  return contextualDetector()(text, nerPipe, opts);
}
async function analyze() {
  const text = $("input").value;
  if (!text.trim()) return;
  if (text.length > MAX_INPUT) {
    setStatus(`Texte trop long (${text.length.toLocaleString("fr-FR")} caract\xE8res, max ${MAX_INPUT.toLocaleString("fr-FR")}). D\xE9coupe-le.`, "error");
    return;
  }
  if (text !== currentText) {
    manualEntities = [];
    removedKeys = /* @__PURE__ */ new Set();
  }
  currentText = text;
  const btn = $("analyzeBtn");
  btn.disabled = true;
  setProcessing(true);
  try {
    await ensureNER();
    const rx = [...detectRegex(text), ...detectPhonesIntl(text)];
    const ner = await detectContextual(text, {
      disabledTypes,
      onProgress: ({ done, total }) => {
        setTextProgress(total ? done / total : null);
        return new Promise((r) => setTimeout(r, 0));
      }
    });
    autoEntities = mergeEntities(rx, filtrerParPrecision(ner, text));
    montrerSuggestion({ prefixe: "profile", texte: text, entites: autoEntities });
    render();
    renderEngineBadge("engineBadge");
  } catch (err) {
    console.error("[clarence]", err);
    $("results").hidden = true;
    setStatus("Analyse \xE9chou\xE9e \u2014 rien n\u2019a \xE9t\xE9 masqu\xE9, ne colle pas ce texte. D\xE9tail dans la console.", "error");
  } finally {
    setProcessing(false);
    setTextProgress(null);
    btn.disabled = false;
  }
}
function maskSelection() {
  const ta = $("input");
  const s = ta.selectionStart, e = ta.selectionEnd;
  if (ta.value !== currentText) {
    setStatus("Lance Analyser d\u2019abord, puis s\xE9lectionne le passage.", "error");
    return;
  }
  if (s === e) {
    setStatus("S\xE9lectionne d\u2019abord un passage dans la zone de texte.", "error");
    return;
  }
  if (manualEntities.some((m) => m.start === s && m.end === e)) {
    setStatus("Ce passage est d\xE9j\xE0 masqu\xE9.", "error");
    return;
  }
  manualEntities.push({
    type: "PERSONNALISE",
    value: currentText.slice(s, e),
    start: s,
    end: e,
    source: "manuel"
  });
  render();
}
async function copyClean() {
  const { masked } = maskText(currentText, activeEntities(), maskOptions());
  await navigator.clipboard.writeText(masked);
  $("copyStatus").textContent = msg("copie_relis");
  $("copyStatus").className = "status active";
  setTimeout(() => {
    $("copyStatus").textContent = "";
  }, 4e3);
}
function setStatus(msg2, cls = "") {
  $("status").textContent = msg2;
  $("status").className = "status " + cls;
}
var ENGINE_MESSAGES = {
  bert: {
    cls: "fallback",
    texte: "D\xE9tection de secours active \u2014 le moteur principal n'a pas pu d\xE9marrer. Les noms isol\xE9s sans phrase autour (titre de CV, cellule de tableau) risquent d'\xEAtre manqu\xE9s. Relis attentivement."
  },
  none: {
    cls: "none",
    texte: "D\xE9tection des noms INDISPONIBLE \u2014 seules les donn\xE9es structur\xE9es (emails, IBAN, t\xE9l\xE9phones\u2026) ont \xE9t\xE9 rep\xE9r\xE9es. Relis attentivement avant de coller."
  }
};
function renderEngineBadge(id) {
  const el = $(id);
  if (!el) return;
  const etat = !nerPipe ? "none" : nerEngine === "bert" ? "bert" : null;
  if (!etat) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.className = "engine-badge " + ENGINE_MESSAGES[etat].cls;
  el.textContent = ENGINE_MESSAGES[etat].texte;
}
$("analyzeBtn").addEventListener("click", analyze);
$("realisticToggle").addEventListener("change", () => {
  if (currentText) render();
});
$("alwaysMask")?.addEventListener("input", () => {
  if (currentText) render();
});
$("alwaysKeep")?.addEventListener("input", () => {
  if (currentText) render();
});
$("typeToggles")?.addEventListener("change", (ev) => {
  const cb = ev.target.closest("input[data-type]");
  if (!cb) return;
  if (cb.checked) disabledTypes.delete(cb.dataset.type);
  else disabledTypes.add(cb.dataset.type);
  if (currentText) render();
  else renderTypeChips("typeToggles", disabledTypes);
});
$("maskSelBtn").addEventListener("click", maskSelection);
$("copyBtn").addEventListener("click", copyClean);
$("toggleReinjectBtn").addEventListener("click", () => {
  const zone = $("reinjectZone");
  zone.hidden = !zone.hidden;
  $("toggleReinjectBtn").textContent = zone.hidden ? msg("desanonymiser_une_reponse_bouton") : msg("masquer_la_desanonymisation");
});
$("reinjectBtn").addEventListener("click", () => {
  const txt = $("reinjectInput").value;
  if (!txt.trim()) return;
  const st = $("reinjectStatus");
  if (!lastMapping.length) {
    st.textContent = "Aucune correspondance en m\xE9moire \u2014 analyse un texte d\u2019abord.";
    st.className = "status error";
    return;
  }
  const found = lastMapping.filter((m) => txt.includes(m.placeholder)).length;
  lastReinjected = reinject(txt, lastMapping);
  const truncated = lastReinjected.length > PREVIEW_LIMIT;
  $("reinjected").hidden = false;
  $("reinjected").textContent = truncated ? lastReinjected.slice(0, PREVIEW_LIMIT) + "\u2026" : lastReinjected;
  $("reinjectedMoreBtn").hidden = !truncated;
  $("copyReinjectBtn").hidden = false;
  st.textContent = found ? `${found} placeholder(s) restitu\xE9(s).` : "Aucun placeholder connu dans ce texte (la table correspond \xE0 la derni\xE8re anonymisation).";
  st.className = "status " + (found ? "active" : "error");
  refreshOverlayIfOpen();
});
$("copyReinjectBtn").addEventListener("click", async () => {
  await navigator.clipboard.writeText(lastReinjected);
  const st = $("reinjectStatus");
  st.textContent = msg("copie");
  st.className = "status active";
});
document.addEventListener("click", (ev) => {
  const mark = ev.target.closest("mark");
  if (!mark) return;
  removedKeys.add(mark.dataset.key);
  render();
});
for (const [btnId, kind] of [
  ["annotatedMoreBtn", "annotated"],
  ["maskedMoreBtn", "masked"],
  ["reinjectedMoreBtn", "reinjected"]
]) {
  $(btnId).addEventListener("click", () => openOverlay(kind));
}
$("overlayCloseBtn").addEventListener("click", closeOverlay);
$("overlay").addEventListener("click", (ev) => {
  if (ev.target === $("overlay")) closeOverlay();
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && overlayKind) closeOverlay();
});
var MARGE_INFOBULLE = 8;
function recadrerInfobulle(tip) {
  const boite = tip.querySelector(".info-tip-box");
  const cadre = document.querySelector(".popup-shell");
  if (!boite || !cadre) return;
  boite.style.transform = "none";
  const r = boite.getBoundingClientRect();
  const c = cadre.getBoundingClientRect();
  let dx = 0;
  if (r.left < c.left + MARGE_INFOBULLE) dx = c.left + MARGE_INFOBULLE - r.left;
  else if (r.right > c.right - MARGE_INFOBULLE) dx = c.right - MARGE_INFOBULLE - r.right;
  if (dx) boite.style.transform = `translateX(${Math.round(dx)}px)`;
}
for (const evenement of ["mouseover", "focusin"]) {
  document.addEventListener(evenement, (ev) => {
    const tip = ev.target?.closest?.(".info-tip");
    if (tip) recadrerInfobulle(tip);
  }, true);
}
var MAX_FILE_BYTES = 5 * 1024 * 1024;
var FILE_TYPES = {
  csv: { mime: "text/csv;charset=utf-8", text: true, load: () => import("./csv-adapter-WGD4I4OD.js") },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", text: false, load: () => import("./xlsx-adapter-6GL77ULE.js") },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", text: false, load: () => import("./docx-adapter-DOKUCGU6.js") },
  // PDF : seul format dont la sortie n'est pas une réécriture du fichier
  // d'origine mais un nouveau document (.md) — outExt gère ce cas particulier
  // dans processFile() (nom de fichier ET extension de sortie changent).
  pdf: { mime: "text/markdown;charset=utf-8", text: false, load: () => import("./pdf-adapter-AJNLKGKK.js"), outExt: ".md" },
  // Images : metadataOnly → processFile() court-circuite le pipeline de
  // détection/masquage (une image n'a pas d'unités PII textuelles) et appelle
  // uniquement stripMetadata (re-encodage canvas, retire EXIF/GPS/chunks).
  jpg: { mime: "image/jpeg", text: false, metadataOnly: true, load: () => import("./image-adapter-2KEQSNMF.js") },
  jpeg: { mime: "image/jpeg", text: false, metadataOnly: true, load: () => import("./image-adapter-2KEQSNMF.js") },
  png: { mime: "image/png", text: false, metadataOnly: true, load: () => import("./image-adapter-2KEQSNMF.js") }
};
var chosenFile = null;
var fileRun = null;
var fileRunId = 0;
var fileOutBlob = null;
var fileOutName = "";
var fileDisabledTypes = new Set(TYPES_PEU_FIABLES);
renderTypeChips("fileTypeToggles", fileDisabledTypes);
$("fileTypeToggles")?.addEventListener("change", (ev) => {
  const cb = ev.target.closest("input[data-type]");
  if (!cb) return;
  if (cb.checked) fileDisabledTypes.delete(cb.dataset.type);
  else fileDisabledTypes.add(cb.dataset.type);
  renderTypeChips("fileTypeToggles", fileDisabledTypes);
  invalidateFileResult();
});
function invalidateFileResult() {
  if (annulerRunFichier("Options modifi\xE9es \u2014 relance l\u2019anonymisation.")) return;
  if (!fileOutBlob) return;
  fileOutBlob = null;
  compressionInfo = null;
  compressionEchouee = null;
  fileOutName = "";
  $("fileResults").hidden = true;
  $("dragCard").hidden = true;
  fileSetStatus("Options modifi\xE9es \u2014 relance.");
}
for (const id of ["pdfModeLight", "pdfModePreserve", "fileRealisticToggle", "filePseudoLocale"]) {
  $(id)?.addEventListener("change", invalidateFileResult);
}
for (const id of ["fileAlwaysMask", "fileAlwaysKeep", "docKeep", "docMask"]) {
  $(id)?.addEventListener("input", invalidateFileResult);
}
function fileSetStatus(msg2, cls = "") {
  $("fileStatus").textContent = msg2;
  $("fileStatus").className = "status " + cls;
}
function extOf(name) {
  const m = /\.([^.]+)$/.exec(name);
  return m ? m[1].toLowerCase() : "";
}
function afficherPoids(file, ext) {
  const badge = $("filePoids");
  const rendre = (poids) => {
    badge.textContent = poids.libelle;
    badge.className = `poids-badge ${poids.classe}`;
    badge.title = expliquerPoids(poids);
    badge.hidden = false;
  };
  rendre(poidsDeTraitement({ ext, taille: file.size }));
  if (ext !== "pdf") return;
  const pourCeFichier = chosenFile;
  (async () => {
    try {
      const pdfjs = await import("./pdf-ITQTBJLX.js");
      const { configurerPdfjs, ressourcesPdfjs } = await import("./pdf-adapter-AJNLKGKK.js");
      configurerPdfjs();
      const buf = await pourCeFichier.arrayBuffer();
      const doc = await pdfjs.getDocument({
        data: new Uint8Array(buf),
        useWorkerFetch: false,
        isEvalSupported: false,
        disableFontFace: true,
        ...ressourcesPdfjs()
      }).promise;
      if (chosenFile !== pourCeFichier) return;
      rendre(poidsDeTraitement({ ext, taille: file.size, pages: doc.numPages }));
    } catch {
    }
  })();
}
function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
function setChosenFile(file) {
  if (!file) return;
  const ext = extOf(file.name);
  if (!FILE_TYPES[ext]) {
    fileSetStatus(msg("format_non_pris_en_charge"), "error");
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    fileSetStatus(`Fichier trop lourd (${humanSize(file.size)}, max ${humanSize(MAX_FILE_BYTES)}).`, "error");
    return;
  }
  annulerRunFichier("");
  fileRegen = null;
  chosenFile = file;
  fileOutBlob = null;
  compressionInfo = null;
  compressionEchouee = null;
  if ($("docKeep")) $("docKeep").value = "";
  if ($("docMask")) $("docMask").value = "";
  rendreApercuTermes();
  const fileNameEl = $("fileName");
  const fileMainEl = fileNameEl?.querySelector(".file-name-main");
  const fileExtEl = fileNameEl?.querySelector(".file-name-ext");
  const lastDot = file.name.lastIndexOf(".");
  if (fileMainEl && fileExtEl) {
    if (lastDot > 0 && lastDot < file.name.length - 1) {
      const ext2 = file.name.slice(lastDot + 1).toLowerCase();
      fileMainEl.textContent = file.name.slice(0, lastDot);
      fileExtEl.textContent = `.${ext2}`;
      fileExtEl.hidden = false;
      fileExtEl.className = `file-name-ext file-name-ext--${ext2}`;
    } else {
      fileMainEl.textContent = file.name;
      fileExtEl.textContent = "";
      fileExtEl.hidden = true;
      fileExtEl.className = "file-name-ext";
    }
  } else {
    fileNameEl.textContent = file.name;
  }
  $("fileSize").textContent = humanSize(file.size);
  afficherPoids(file, ext);
  $("fileChosen").hidden = false;
  $("fileOptions").hidden = !!FILE_TYPES[ext].metadataOnly;
  $("pdfModeChoice").hidden = ext !== "pdf";
  majVisibiliteCompression(ext);
  $("fileAnalyzeBtn").textContent = FILE_TYPES[ext].metadataOnly ? msg("nettoyer_les_metadonnees") : msg("anonymiser_le_fichier");
  $("fileResults").hidden = true;
  fileSetStatus("");
}
function fileMaskOptions(units = []) {
  if (!$("fileRealisticToggle")?.checked) return {};
  const joined = units.map((u) => u.text).join("\n");
  return {
    pseudonymize: createPseudonymizer({
      seed: pseudoSeed,
      avoid: (v) => joined.includes(v),
      locale: $("filePseudoLocale")?.value || "fr"
    })
  };
}
var fileRegen = null;
var termesAGarder = () => [
  ...parseLines($("fileAlwaysKeep")?.value),
  ...parseLines($("docKeep")?.value)
];
var termesAMasquer = () => [
  ...parseLines($("fileAlwaysMask")?.value),
  ...parseLines($("docMask")?.value),
  ...identityForceTerms()
];
async function retirerDuMasquage(valeur) {
  const champ = $("docKeep");
  if (!fileRegen || !champ) return;
  const avant = champ.value;
  champ.value = ajouterTerme(avant, valeur);
  if (champ.value === avant) return;
  rendreApercuTermes();
  const btn = $("fileAnalyzeBtn");
  btn.disabled = true;
  fileSetStatus(msg("etat_maj_fichier"));
  try {
    const r = fileRegen;
    const keepValues = termesAGarder();
    const forceTerms = termesAMasquer();
    let mapping;
    if (r.mode === "pdf") {
      const { reconstructPdf } = await import("./pdf-reconstruct-FDMDYSJT.js");
      const pdflib = await import("./es-RR6ZCDY3.js");
      const res = await reconstructPdf(r.tampon.slice(0), {
        entitesConnues: r.entites,
        maskOpts: fileMaskOptions(),
        forceTerms,
        keepValues,
        disabledTypes: fileDisabledTypes,
        deps: { PDFDocument: pdflib.PDFDocument, StandardFonts: pdflib.StandardFonts }
      });
      fileOutBlob = new Blob([res.buffer], { type: "application/pdf" });
      mapping = res.mapping;
    } else {
      const { anonymizeUnits } = await import("./anonymize-units-DABIJPJR.js");
      const { results, mapping: m } = await anonymizeUnits(r.units, {
        entitesConnues: r.entites,
        intitules: r.intitules,
        maskOpts: fileMaskOptions(r.units),
        forceTerms,
        keepValues,
        disabledTypes: fileDisabledTypes
      });
      const byId = new Map(results.map((x) => [x.id, { maskedText: x.maskedText, entities: x.entities }]));
      const masked = await r.adapter.applyMask(r.input, byId);
      fileOutBlob = new Blob([await r.adapter.stripMetadata(masked)], { type: r.kind.mime });
      mapping = m;
    }
    showFileResults(mapping, r.kind.mime.startsWith("text/"));
    fileSetStatus(`\xAB ${valeur} \xBB n\u2019est plus masqu\xE9.`);
  } catch (err) {
    console.error("[clarence]", err);
    champ.value = avant;
    rendreApercuTermes();
    fileSetStatus("Mise \xE0 jour impossible. D\xE9tail en console.", "error");
  } finally {
    btn.disabled = false;
  }
}
function compressionApplicable(ext) {
  return !!(ext && FILE_TYPES[ext] && !FILE_TYPES[ext].metadataOnly);
}
function majVisibiliteCompression(ext) {
  const bloc = $("fileCompressBtn");
  if (!bloc) return;
  bloc.hidden = !compressionApplicable(ext);
  if (bloc.hidden && $("fileCompress")) $("fileCompress").checked = false;
  majVisibiliteTaux();
}
function majSousOptions() {
  const paires = [
    ["fileCompress", "fileCompressTauxLabel"],
    ["fileRealisticToggle", "filePseudoLocaleLabel"],
    ["realisticToggle", "pseudoLocaleLabel"]
  ];
  for (const [idCase, idSousOption] of paires) {
    const l = $(idSousOption);
    if (l) l.hidden = !$(idCase)?.checked;
  }
}
var majVisibiliteTaux = majSousOptions;
function formatDuree(ms) {
  const s = ms / 1e3;
  if (s < 10) return `${s.toFixed(1)} s`;
  if (s < 60) return `${Math.round(s)} s`;
  const min = Math.floor(s / 60);
  const reste = Math.round(s % 60);
  return reste ? `${min} min ${reste}` : `${min} min`;
}
function showFileResults(mapping, copyable, duree) {
  lastMapping = mapping;
  chrome.storage?.session?.set({ clarenceMapping: mapping }).catch(() => {
  });
  const triees = [...mapping].sort((a, b) => (b.occurrences || 0) - (a.occurrences || 0));
  $("fileMappingWrap").innerHTML = mapping.length ? `<table>${triees.map(
    (m) => `<tr><td class="mono">${esc(m.placeholder)}</td><td class="mono">${esc(m.value)}</td><td class="map-occ">${m.occurrences || 1}\xD7</td><td class="map-actions"><button type="button" class="map-retirer" data-valeur="${esc(m.value)}" title="${msg("infobulle_garder")}">${msg("garder")}</button><button type="button" class="map-profil" data-valeur="${esc(m.value)}" data-type="${esc(m.type || "")}" title="${msg("infobulle_au_profil")}">${msg("au_profil")}</button></td></tr>`
  ).join("")}</table>` : `<p>${msg("aucun_masque_actif")}</p>`;
  const suffixe = (duree ? ` ${duree}.` : "") + (compressionEchouee ? ` \u26A0 Compression indisponible : ${compressionEchouee}.` : "") + (compressionInfo ? ` \u2248 ${compressionInfo.avant} \u2192 ${compressionInfo.apres} tokens (\u2212${Math.round((1 - compressionInfo.apres / compressionInfo.avant) * 100)} %).` : "");
  $("fileSummary").textContent = (mapping.length ? `${mapping.length} valeurs masqu\xE9es, m\xE9tadonn\xE9es nettoy\xE9es.` : msg("aucune_donnee_sensible")) + suffixe;
  $("fileSummary").className = "status active";
  $("fileResults").hidden = false;
  $("fileCopyBtn").hidden = !copyable;
  $("reinjectSection").hidden = false;
  $("dragCard").hidden = !document.body.classList.contains("panel-mode");
}
function setProgress(trackId, fillId, ratio) {
  const track = $(trackId);
  const fill = $(fillId);
  if (!track || !fill) return;
  if (ratio == null) {
    track.hidden = true;
    fill.style.transform = "scaleX(0)";
    return;
  }
  track.hidden = false;
  fill.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
}
var setTextProgress = (r) => setProgress("textProgress", "textProgressFill", r);
var etapes = [];
function declarerEtapes(liste) {
  etapes = liste.map((e) => ({ ...e, etat: "attente", ratio: 0 }));
  rendreEtapes();
}
function majEtape(id, champs) {
  const e = etapes.find((x) => x.id === id);
  if (!e) return;
  Object.assign(e, champs);
  rendreEtapes();
}
var avancerEtape = (id, ratio) => majEtape(id, { etat: "cours", ratio: ratio ?? 0 });
var terminerEtape = (id) => majEtape(id, { etat: "faite", ratio: 1 });
var effacerEtapes = () => {
  etapes = [];
  rendreEtapes();
};
function rendreEtapes() {
  const hote = $("fileEtapes");
  if (!hote) return;
  hote.textContent = "";
  for (const e of etapes) {
    if (e.etat === "attente") continue;
    if (e.etat === "faite") {
      const puce = document.createElement("div");
      puce.className = "etape-faite";
      puce.append(e.libelle);
      const coche = document.createElement("span");
      coche.className = "coche";
      coche.setAttribute("aria-hidden", "true");
      coche.textContent = "\u2713";
      puce.append(coche);
      hote.append(puce);
      continue;
    }
    const bloc = document.createElement("div");
    bloc.className = "etape";
    const libelle = document.createElement("div");
    libelle.className = "etape-libelle";
    const nom = document.createElement("span");
    nom.textContent = e.libelle;
    const pct = document.createElement("span");
    pct.className = "etape-pct";
    pct.setAttribute("aria-hidden", "true");
    pct.textContent = `${Math.round(Math.max(0, Math.min(1, e.ratio)) * 100)} %`;
    libelle.append(nom, pct);
    const piste = document.createElement("div");
    piste.className = "progress-track";
    const jauge = document.createElement("div");
    jauge.className = `progress-fill${e.teinte ? " " + e.teinte : ""}`;
    jauge.style.transform = `scaleX(${Math.max(0, Math.min(1, e.ratio))})`;
    piste.append(jauge);
    bloc.append(libelle, piste);
    hote.append(bloc);
  }
}
var compressionProgress = ({ fait, total }) => {
  if (total && fait >= total) terminerEtape("compression");
  else avancerEtape("compression", total ? fait / total : 0);
  return new Promise((r) => setTimeout(r, 0));
};
var nerProgress = ({ done, total }) => {
  if (total && done >= total) terminerEtape("detection");
  else avancerEtape("detection", total ? done / total : 0);
  return new Promise((r) => setTimeout(r, 0));
};
var LETTER_GRID_LETTERS = ["c", "l", "a", "r", "e", "n"];
var LETTER_GRID_CELL = 16;
var LETTER_GRID_FONT_PX = 9;
var LETTER_GRID_TICK_MS = 300;
var LETTER_GRID_VIRTUAL_PX = 1800;
var LETTER_GRID_ROWS_PER_BLOB = 4.5;
var LETTER_GRID_R = [2.4, 4.6];
var LETTER_GRID_THRESHOLD = 0.34;
var LETTER_GRID_JITTER = 0.22;
var LETTER_GRID_STRAY_COUNT = [4, 7];
var LETTER_GRID_DRIFT_MAX = 0.1;
var LETTER_GRID_DRIFT_ACCEL = 0.03;
var LETTER_GRID_DRIFT_RANGE = 1.4;
var LETTER_GRID_EASE = 0.22;
var LETTER_GRID_CLEAR_PAD = 0;
var LETTER_GRID_OPAQUE_A = 0.85;
var LETTER_GRID_TINT_VARS = ["--seal-lit", "--moss", "--tan", "--paper-dim"];
var LETTER_GRID_TINT_TARGET = "cell";
var LETTER_GRID_TINT_EVERY_MS = [1600, 4400];
var LETTER_GRID_TINT_CELLS = [1, 3];
var LETTER_GRID_TINT_LIFE_MS = [600, 1800];
var LETTER_GRID_TINT_BUSY_EVERY_MS = [280, 900];
var LETTER_GRID_TINT_BUSY_CELLS = [3, 7];
var LETTER_GRID_TINT_BUSY_LIFE_MS = [900, 2400];
var LETTER_GRID_TINT_MAX_SHARE = 0.3;
var letterGridCanvas = null;
var letterGridCtx = null;
var letterGridTimer = null;
var letterGridCols = 0;
var letterGridRows = 0;
var letterGridSeed = 0;
var letterGridBalls = null;
var letterGridStrays = null;
var letterGridBlocked = null;
var letterGridCellFill = "#000105";
var letterGridLetterFill = "#FFFFFF";
var letterGridPalette = [];
var letterGridTints = /* @__PURE__ */ new Map();
var letterGridPainted = [];
var letterGridNextTint = 0;
function letterGridRandLetter(exclude) {
  let l;
  do {
    l = LETTER_GRID_LETTERS[Math.random() * LETTER_GRID_LETTERS.length | 0];
  } while (l === exclude);
  return l;
}
function letterGridHash(x, y, seed) {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647 | 0;
  h = (h ^ h >>> 13) * 1274126177;
  h = h ^ h >>> 16;
  return (h >>> 0) / 4294967295 * 2 - 1;
}
function letterGridMask(cx, cy) {
  let field = 0;
  for (const b of letterGridBalls) {
    const dx = (cx - b.x) / b.r, dy = (cy - b.y) / b.r;
    const d2 = dx * dx + dy * dy;
    if (d2 < 1) {
      const k = 1 - d2;
      field += k * k;
    }
  }
  return field + letterGridHash(cx, cy, letterGridSeed) * LETTER_GRID_JITTER > LETTER_GRID_THRESHOLD;
}
function letterGridBuildBalls(cols, rowsVirtual) {
  const n = Math.max(3, Math.round(rowsVirtual / LETTER_GRID_ROWS_PER_BLOB));
  const [rmin, rmax] = LETTER_GRID_R;
  const balls = [];
  for (let i = 0; i < n; i++) {
    const x0 = Math.random() * cols;
    const y0 = Math.random() * rowsVirtual;
    balls.push({ x0, y0, x: x0, y: y0, vx: 0, vy: 0, r: rmin + Math.random() * (rmax - rmin) });
  }
  return balls;
}
function letterGridStrayIsFree(col, row, strays) {
  if (letterGridMask(col, row)) return false;
  if (strays.some((s) => s.col === col && s.row === row)) return false;
  for (let dc = -2; dc <= 2; dc++) {
    for (let dr = -2; dr <= 2; dr++) {
      if (letterGridMask(col + dc, row + dr)) return false;
    }
  }
  return true;
}
function letterGridBuildStrays(cols, rowsVirtual) {
  const [min, max] = LETTER_GRID_STRAY_COUNT;
  const target = min + (Math.random() * (max - min + 1) | 0);
  const strays = [];
  let attempts = 0;
  while (strays.length < target && attempts < target * 120) {
    attempts++;
    const col = Math.random() * cols | 0;
    const row = Math.random() * rowsVirtual | 0;
    if (!letterGridStrayIsFree(col, row, strays)) continue;
    strays.push({ col, row, letter: letterGridRandLetter() });
  }
  return strays;
}
function letterGridIsOpaque(el) {
  const m = /^rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor);
  if (!m) return false;
  const parts = m[1].split(",").map(parseFloat);
  return (parts.length > 3 ? parts[3] : 1) >= LETTER_GRID_OPAQUE_A;
}
function letterGridComputeBlocked(host, cellCss) {
  const blocked = /* @__PURE__ */ new Set();
  const wrap = document.querySelector(".wrap");
  if (!wrap) return blocked;
  const base = host.getBoundingClientRect();
  const pad = LETTER_GRID_CLEAR_PAD;
  const add = (r) => {
    if (r.width <= 0 || r.height <= 0) return;
    const c0 = Math.floor((r.left - base.left - pad) / cellCss);
    const c1 = Math.ceil((r.right - base.left + pad) / cellCss);
    const r0 = Math.floor((r.top - base.top - pad) / cellCss);
    const r1 = Math.ceil((r.bottom - base.top + pad) / cellCss);
    for (let col = c0; col < c1; col++) {
      for (let row = r0; row < r1; row++) blocked.add(col + "," + row);
    }
  };
  const opaque = /* @__PURE__ */ new Map();
  const hidden = (node) => {
    for (let el = node.parentElement; el && el !== wrap; el = el.parentElement) {
      if (el.id === "letterBg") return true;
      let v = opaque.get(el);
      if (v === void 0) {
        v = letterGridIsOpaque(el);
        opaque.set(el, v);
      }
      if (v) return true;
    }
    return false;
  };
  const walker = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim() || hidden(n)) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) add(r);
  }
  for (const img of wrap.querySelectorAll("img")) {
    if (!hidden(img)) add(img.getBoundingClientRect());
  }
  for (const t of wrap.querySelectorAll("table")) {
    if (!hidden(t)) add(t.getBoundingClientRect());
  }
  return blocked;
}
function letterGridPaintCell(col, row, letter, cellPx, tint) {
  const ctx = letterGridCtx;
  const x = col * cellPx, y = row * cellPx;
  ctx.fillStyle = tint && LETTER_GRID_TINT_TARGET === "cell" ? tint : letterGridCellFill;
  ctx.fillRect(x, y, cellPx, cellPx);
  ctx.fillStyle = tint && LETTER_GRID_TINT_TARGET === "letter" ? tint : letterGridLetterFill;
  ctx.fillText(letter, x + cellPx / 2, y + cellPx / 2 + 1);
}
function letterGridTintOf(key, now) {
  const t = letterGridTints.get(key);
  return t && t.until > now ? t.color : null;
}
function letterGridScheduleTints(now, processing) {
  if (now < letterGridNextTint) return;
  const [every0, every1] = processing ? LETTER_GRID_TINT_BUSY_EVERY_MS : LETTER_GRID_TINT_EVERY_MS;
  letterGridNextTint = now + every0 + Math.random() * (every1 - every0);
  for (const [key, t] of letterGridTints) {
    if (t.until <= now) letterGridTints.delete(key);
  }
  if (!letterGridPainted.length || !letterGridPalette.length) return;
  const [cmin, cmax] = processing ? LETTER_GRID_TINT_BUSY_CELLS : LETTER_GRID_TINT_CELLS;
  const [life0, life1] = processing ? LETTER_GRID_TINT_BUSY_LIFE_MS : LETTER_GRID_TINT_LIFE_MS;
  const room = Math.floor(letterGridPainted.length * LETTER_GRID_TINT_MAX_SHARE) - letterGridTints.size;
  const n = Math.min(cmin + (Math.random() * (cmax - cmin + 1) | 0), room);
  for (let i = 0; i < n; i++) {
    letterGridTints.set(letterGridPainted[Math.random() * letterGridPainted.length | 0], {
      color: letterGridPalette[Math.random() * letterGridPalette.length | 0],
      until: now + life0 + Math.random() * (life1 - life0)
    });
  }
}
function letterGridRedraw() {
  const cellPx = letterGridCanvas.width / letterGridCols;
  const now = performance.now();
  letterGridCtx.clearRect(0, 0, letterGridCanvas.width, letterGridCanvas.height);
  letterGridPainted.length = 0;
  for (let col = 0; col < letterGridCols; col++) {
    for (let row = 0; row < letterGridRows; row++) {
      const key = col + "," + row;
      if (letterGridBlocked.has(key)) continue;
      if (!letterGridMask(col, row)) continue;
      letterGridPainted.push(key);
      letterGridPaintCell(col, row, letterGridRandLetter(), cellPx, letterGridTintOf(key, now));
    }
  }
  for (const s of letterGridStrays) {
    if (s.row >= letterGridRows) continue;
    const key = s.col + "," + s.row;
    if (letterGridBlocked.has(key)) continue;
    letterGridPainted.push(key);
    s.letter = letterGridRandLetter(s.letter);
    letterGridPaintCell(s.col, s.row, s.letter, cellPx, letterGridTintOf(key, now));
  }
}
function letterGridStepBall(b, processing) {
  if (processing) {
    b.vx += (Math.random() * 2 - 1) * LETTER_GRID_DRIFT_ACCEL;
    b.vy += (Math.random() * 2 - 1) * LETTER_GRID_DRIFT_ACCEL;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > LETTER_GRID_DRIFT_MAX) {
      b.vx = b.vx / speed * LETTER_GRID_DRIFT_MAX;
      b.vy = b.vy / speed * LETTER_GRID_DRIFT_MAX;
    }
    b.x += b.vx;
    b.y += b.vy;
    const R = LETTER_GRID_DRIFT_RANGE;
    if (b.x < b.x0 - R) {
      b.x = b.x0 - R;
      b.vx = Math.abs(b.vx);
    }
    if (b.x > b.x0 + R) {
      b.x = b.x0 + R;
      b.vx = -Math.abs(b.vx);
    }
    if (b.y < b.y0 - R) {
      b.y = b.y0 - R;
      b.vy = Math.abs(b.vy);
    }
    if (b.y > b.y0 + R) {
      b.y = b.y0 + R;
      b.vy = -Math.abs(b.vy);
    }
  } else {
    b.vx = 0;
    b.vy = 0;
    b.x += (b.x0 - b.x) * LETTER_GRID_EASE;
    b.y += (b.y0 - b.y) * LETTER_GRID_EASE;
    if (Math.abs(b.x0 - b.x) < 0.02 && Math.abs(b.y0 - b.y) < 0.02) {
      b.x = b.x0;
      b.y = b.y0;
    }
  }
}
function letterGridTick() {
  const processing = document.body.classList.contains("processing");
  for (const b of letterGridBalls) letterGridStepBall(b, processing);
  letterGridScheduleTints(performance.now(), processing);
  letterGridRedraw();
}
function letterGridResize() {
  const host = $("letterBg");
  if (!host || !letterGridCanvas) return;
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  const dpr = window.devicePixelRatio || 1;
  const cellPx = Math.round(LETTER_GRID_CELL * dpr);
  letterGridCols = Math.ceil(w * dpr / cellPx);
  letterGridRows = Math.ceil(h * dpr / cellPx);
  letterGridCanvas.width = letterGridCols * cellPx;
  letterGridCanvas.height = letterGridRows * cellPx;
  letterGridCanvas.style.width = letterGridCanvas.width / dpr + "px";
  letterGridCanvas.style.height = letterGridCanvas.height / dpr + "px";
  const css = getComputedStyle(document.body);
  letterGridCtx.textAlign = "center";
  letterGridCtx.textBaseline = "middle";
  letterGridCtx.font = `${Math.round(LETTER_GRID_FONT_PX * dpr)}px ${css.fontFamily}`;
  letterGridCellFill = css.getPropertyValue("--seal").trim() || "#000105";
  letterGridLetterFill = css.getPropertyValue("--paper").trim() || "#FFFFFF";
  letterGridPalette = LETTER_GRID_TINT_VARS.map((v) => css.getPropertyValue(v).trim()).filter(Boolean);
  letterGridBlocked = letterGridComputeBlocked(host, cellPx / dpr);
  letterGridRedraw();
}
function letterGridMount() {
  const host = $("letterBg");
  if (!host || !host.clientWidth) return;
  letterGridCanvas = document.createElement("canvas");
  host.appendChild(letterGridCanvas);
  letterGridCtx = letterGridCanvas.getContext("2d");
  for (const id of ["letterBgGlow", "letterBgBlur"]) {
    if (!host.querySelector("#" + id)) {
      const couche = document.createElement("div");
      couche.id = id;
      host.appendChild(couche);
    }
  }
  const dpr = window.devicePixelRatio || 1;
  const cellPx = Math.round(LETTER_GRID_CELL * dpr);
  const cols = Math.ceil(host.clientWidth * dpr / cellPx);
  const rowsVirtual = Math.ceil(LETTER_GRID_VIRTUAL_PX / LETTER_GRID_CELL);
  letterGridSeed = Math.random() * 1e6 | 0;
  letterGridBalls = letterGridBuildBalls(cols, rowsVirtual);
  letterGridStrays = letterGridBuildStrays(cols, rowsVirtual);
  letterGridResize();
  let resizeT = null;
  new ResizeObserver(() => {
    clearTimeout(resizeT);
    resizeT = setTimeout(letterGridResize, 120);
  }).observe(document.querySelector(".wrap"));
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    letterGridTimer = setInterval(letterGridTick, LETTER_GRID_TICK_MS);
  }
}
var LETTER_BG_BLUR_RADIUS = 110;
var letterBgBlurPos = null;
var letterBgBlurRaf = 0;
function applyLetterBgBlur() {
  letterBgBlurRaf = 0;
  const blur = document.querySelector("#letterBgBlur");
  if (!blur || !letterBgBlurPos) return;
  blur.style.setProperty("--letterBgBlur-x", `${letterBgBlurPos.x}px`);
  blur.style.setProperty("--letterBgBlur-y", `${letterBgBlurPos.y}px`);
  blur.style.setProperty("--letterBgBlur-radius", `${LETTER_BG_BLUR_RADIUS}px`);
}
function updateLetterBgBlur(evt) {
  const host = document.querySelector("#letterBg");
  if (!host) return;
  const rect = host.getBoundingClientRect();
  letterBgBlurPos = {
    x: Math.max(0, Math.min(rect.width, evt.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, evt.clientY - rect.top))
  };
  if (!letterBgBlurRaf) letterBgBlurRaf = requestAnimationFrame(applyLetterBgBlur);
}
function resetLetterBgBlur() {
  const blur = document.querySelector("#letterBgBlur");
  if (!blur) return;
  if (letterBgBlurRaf) {
    cancelAnimationFrame(letterBgBlurRaf);
    letterBgBlurRaf = 0;
  }
  letterBgBlurPos = null;
  blur.style.setProperty("--letterBgBlur-radius", "0px");
}
function initLetterBgBlur() {
  const wrap = document.querySelector(".wrap");
  if (!wrap) return;
  wrap.addEventListener("pointermove", updateLetterBgBlur, { passive: true });
  wrap.addEventListener("pointerleave", resetLetterBgBlur);
  wrap.addEventListener("pointerenter", updateLetterBgBlur, { passive: true });
}
letterGridMount();
initLetterBgBlur();
function setProcessing(on) {
  document.body.classList.toggle("processing", !!on);
}
function setAnalyzeBtnLoading(loading) {
  const btn = $("fileAnalyzeBtn");
  if (loading) {
    if (!btn.classList.contains("loading")) btn.dataset.label = btn.textContent;
    btn.classList.add("loading");
    btn.innerHTML = '<span class="dots"><i></i><i></i><i></i><i></i><i></i></span>';
  } else {
    btn.classList.remove("loading");
    if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
}
function annulerRunFichier(motif) {
  if (!fileRun) return false;
  const run = fileRun;
  fileRun = null;
  run.controller.abort(new OperationAnnulee());
  purgerWorkerNer(new OperationAnnulee());
  setProcessing(false);
  effacerEtapes();
  setAnalyzeBtnLoading(false);
  $("fileAnalyzeBtn").disabled = false;
  $("fileCancelBtn").hidden = true;
  fileSetStatus(motif === void 0 ? msg("traitement_annule") : motif);
  return true;
}
async function processFile() {
  if (!chosenFile) return;
  annulerRunFichier("");
  fileRegen = null;
  const source = chosenFile;
  const run = { id: ++fileRunId, controller: new AbortController() };
  fileRun = run;
  const signal = run.controller.signal;
  const courant = () => fileRun === run;
  const ext = extOf(source.name);
  const kind = FILE_TYPES[ext];
  const btn = $("fileAnalyzeBtn");
  btn.disabled = true;
  $("fileCancelBtn").hidden = false;
  setProcessing(true);
  setAnalyzeBtnLoading(true);
  const debut = performance.now();
  declarerEtapes([
    { id: "detection", libelle: msg("etape_detection") },
    ...$("fileCompress")?.checked && !FILE_TYPES[extOf(source.name)]?.metadataOnly ? [{ id: "compression", libelle: msg("etape_compression"), teinte: "teinte-tan" }] : []
  ]);
  fileSetStatus(msg("etat_lecture_fichier"));
  try {
    const adapter = await kind.load();
    verifierAnnulation(signal);
    if (kind.metadataOnly) {
      fileSetStatus(msg("etat_metadonnees"));
      const cleaned2 = await adapter.stripMetadata(await source.arrayBuffer(), { mime: kind.mime });
      verifierAnnulation(signal);
      fileOutBlob = new Blob([cleaned2], { type: kind.mime });
      fileOutName = source.name.replace(/(\.[^.]+)$/, "-nettoye$1");
      $("fileMappingWrap").innerHTML = "<p>Image : m\xE9tadonn\xE9es (EXIF/GPS/appareil) retir\xE9es. Le contenu visuel n'est pas modifi\xE9.</p>";
      $("fileSummary").textContent = `M\xE9tadonn\xE9es retir\xE9es (EXIF, GPS, appareil). Trait\xE9 en ${formatDuree(performance.now() - debut)}.`;
      $("fileSummary").className = "status active";
      $("fileResults").hidden = false;
      $("fileCopyBtn").hidden = true;
      $("dragCard").hidden = !document.body.classList.contains("panel-mode");
      fileSetStatus("");
      return;
    }
    if ($("fileCompress")?.checked) {
      fileSetStatus(msg("etat_preparation"));
      const dispo = await ensureCompression();
      if (!dispo.ok) {
        $("fileCompress").checked = false;
        compressionEchouee = dispo.message || "raison inconnue";
      }
      verifierAnnulation(signal);
    }
    if (ext === "pdf" && $("pdfModePreserve")?.checked) {
      fileSetStatus(msg("etat_lecture_pdf"));
      await ensureNER();
      verifierAnnulation(signal);
      const { reconstructPdf } = await import("./pdf-reconstruct-FDMDYSJT.js");
      const pdflib = await import("./es-RR6ZCDY3.js");
      const tampon = await source.arrayBuffer();
      const { buffer: outBuf, mapping: mapping2, entitesContextuelles: entitesContextuelles2 } = await reconstructPdf(tampon, {
        signal,
        nerPipeline: nerPipe,
        nerDetect: contextualDetector(),
        arbitre: arbitreContextuel(),
        onProgress: nerProgress,
        // Manquait entièrement : le PDF reconstruit ignorait la case
        // Pseudonymes, contrairement aux autres formats. Toujours [TYPE_N].
        // SANS argument : `units` n'existe pas encore sur ce chemin (il est
        // déclaré plus bas, pour l'autre branche) — le lui passer plantait en
        // « Cannot access 'units' before initialization ». reconstructPdf
        // extrait ses propres unités en interne.
        maskOpts: fileMaskOptions(),
        forceTerms: termesAMasquer(),
        disabledTypes: fileDisabledTypes,
        keepValues: termesAGarder(),
        compresserUnite: crochetCompression(),
        deps: { PDFDocument: pdflib.PDFDocument, StandardFonts: pdflib.StandardFonts }
      });
      verifierAnnulation(signal);
      fileOutBlob = new Blob([outBuf], { type: "application/pdf" });
      fileOutName = source.name.replace(/(\.[^.]+)$/, "-anonymise$1");
      fileRegen = { mode: "pdf", tampon, entites: entitesContextuelles2, source, kind, ext };
      showFileResults(mapping2, false, formatDuree(performance.now() - debut));
      renderEngineBadge("fileEngineBadge");
      fileSetStatus("");
      return;
    }
    const { anonymizeUnits } = await import("./anonymize-units-DABIJPJR.js");
    const input = kind.text ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(await source.arrayBuffer()) : await source.arrayBuffer();
    const { units, intitules } = await adapter.extractTextUnits(input);
    if (!units.length) {
      fileSetStatus(msg("aucun_texte"), "error");
      return;
    }
    fileSetStatus(msg("etat_detection"));
    await ensureNER();
    verifierAnnulation(signal);
    const { results, mapping, entitesContextuelles } = await anonymizeUnits(units, {
      signal,
      nerPipeline: nerPipe,
      nerDetect: contextualDetector(),
      arbitre: arbitreContextuel(),
      intitules,
      onProgress: nerProgress,
      maskOpts: fileMaskOptions(units),
      // Règles personnalisées : mêmes primitives que le mode texte
      // (selection.js), appliquées au document combiné entier.
      forceTerms: termesAMasquer(),
      disabledTypes: fileDisabledTypes,
      keepValues: termesAGarder()
    });
    montrerSuggestion({
      prefixe: "fileProfile",
      texte: units.map((u) => u.text).join("\n"),
      entites: entitesContextuelles || []
    });
    if ($("fileCompress")?.checked && compressionWorker && ext !== "docx") {
      fileSetStatus(msg("etat_compression"));
      const taux = Number($("fileCompressTaux")?.value || 0.5);
      let avant = 0, apres = 0;
      try {
        let fait = 0;
        for (const r of results) {
          const c = await compresser(r.maskedText, compressionPipeline(), { taux });
          r.maskedText = c.texte;
          avant += c.tokensAvant;
          apres += c.tokensApres;
          await compressionProgress({ fait: ++fait, total: results.length });
          verifierAnnulation(signal);
        }
        compressionInfo = { avant, apres };
        terminerEtape("compression");
      } catch (err) {
        if (estAnnulation(err)) throw err;
        console.error("[clarence] compression interrompue :", err);
        compressionEchouee = String(err?.message || err);
      }
    }
    terminerEtape("detection");
    const byId = new Map(results.map((r) => [r.id, { maskedText: r.maskedText, entities: r.entities }]));
    fileSetStatus("R\xE9\xE9criture du fichier\u2026");
    const masked = await adapter.applyMask(input, byId, { compresserUnite: crochetCompression() });
    const cleaned = await adapter.stripMetadata(masked);
    verifierAnnulation(signal);
    fileOutBlob = new Blob([cleaned], { type: kind.mime });
    fileOutName = kind.outExt ? source.name.replace(/\.[^.]+$/, "-anonymise" + kind.outExt) : source.name.replace(/(\.[^.]+)$/, "-anonymise$1");
    fileRegen = {
      mode: "standard",
      input,
      units,
      intitules,
      entites: entitesContextuelles,
      adapter,
      source,
      kind,
      ext
    };
    showFileResults(mapping, kind.mime.startsWith("text/"), formatDuree(performance.now() - debut));
    renderEngineBadge("fileEngineBadge");
    fileSetStatus("");
  } catch (err) {
    if (estAnnulation(err)) return;
    console.error("[clarence]", err);
    if (!courant()) return;
    fileOutBlob = null;
    compressionInfo = null;
    compressionEchouee = null;
    $("fileResults").hidden = true;
    $("dragCard").hidden = true;
    fileSetStatus("\xC9chec \u2014 fichier non anonymis\xE9. D\xE9tail en console.", "error");
  } finally {
    if (courant()) {
      fileRun = null;
      setProcessing(false);
      setAnalyzeBtnLoading(false);
      btn.disabled = false;
      $("fileCancelBtn").hidden = true;
    }
  }
}
async function downloadFile() {
  if (!fileOutBlob) return;
  const url = URL.createObjectURL(fileOutBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileOutName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
for (const btn of document.querySelectorAll(".mode-btn")) {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    for (const b of document.querySelectorAll(".mode-btn")) {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    }
    $("textMode").hidden = mode !== "text";
    $("fileMode").hidden = mode !== "file";
    $("reinjectZone").hidden = true;
    $("toggleReinjectBtn").textContent = msg("desanonymiser_une_reponse_bouton");
  });
}
$("filePickBtn").addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", (ev) => setChosenFile(ev.target.files[0]));
for (const [idChamp] of APERCUS_TERMES) {
  $(idChamp)?.addEventListener("input", rendreApercuTermes);
}
rendreApercuTermes();
$("fileCancelBtn").addEventListener("click", () => annulerRunFichier());
$("fileMappingWrap").addEventListener("click", (ev) => {
  const btn = ev.target.closest(".map-retirer");
  if (btn) {
    retirerDuMasquage(btn.dataset.valeur);
    return;
  }
  const prof = ev.target.closest(".map-profil");
  if (prof) demanderCategorie(prof);
});
var CATEGORIE_PAR_TYPE = {
  PER: "nom",
  EMAIL: "emails",
  TELEPHONE: "telephones",
  ADRESSE: "adresse",
  CODE_POSTAL_VILLE: "ville",
  LOC: "ville",
  DATE_NAISSANCE: "dateNaissance",
  ORG: "employeurs",
  ETABLISSEMENT: "ecoles",
  PSEUDO: "pseudos"
};
function demanderCategorie(bouton) {
  const valeur = bouton.dataset.valeur;
  const cellule = bouton.parentElement;
  const avant = cellule.innerHTML;
  const choisi = CATEGORIE_PAR_TYPE[bouton.dataset.type] || "autres";
  const sel = document.createElement("select");
  sel.className = "mini-select map-categorie";
  sel.setAttribute("aria-label", msg("infobulle_au_profil"));
  sel.innerHTML = IDENTITY_FIELDS.map(([k, label]) => `<option value="${k}"${k === choisi ? " selected" : ""}>${esc(label)}</option>`).join("");
  cellule.innerHTML = "";
  cellule.appendChild(sel);
  sel.focus();
  const restaurer = () => {
    cellule.innerHTML = avant;
  };
  sel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") restaurer();
  });
  sel.addEventListener("blur", () => setTimeout(restaurer, 120));
  sel.addEventListener("change", async () => {
    const champs = { ...identityCache.champs };
    const liste = [...champs[sel.value] || []];
    if (!liste.includes(valeur)) liste.push(valeur);
    champs[sel.value] = liste;
    await saveIdentity({ ...identityCache, champs, status: "configure" });
    identityCache = await loadIdentity();
    restaurer();
    fileSetStatus(msg("ajoute_au_profil", [valeur]), "ok");
  });
}
$("fileResetBtn").addEventListener("click", () => {
  annulerRunFichier("");
  chosenFile = null;
  fileOutBlob = null;
  compressionInfo = null;
  compressionEchouee = null;
  $("fileInput").value = "";
  $("fileChosen").hidden = true;
  $("filePoids").hidden = true;
  $("fileOptions").hidden = true;
  $("fileResults").hidden = true;
  $("fileCopyBtn").hidden = true;
  $("dragCard").hidden = true;
  fileSetStatus("");
});
for (const id of ["pdfModeLight", "pdfModePreserve"]) {
  $(id)?.addEventListener("change", () => majVisibiliteCompression(extOf(chosenFile?.name || "")));
}
for (const id of ["fileCompress", "fileRealisticToggle", "realisticToggle"]) {
  $(id)?.addEventListener("change", majSousOptions);
}
majSousOptions();
$("fileAnalyzeBtn").addEventListener("click", processFile);
$("fileDownloadBtn").addEventListener("click", downloadFile);
$("fileCopyBtn").addEventListener("click", async () => {
  if (!fileOutBlob) return;
  await navigator.clipboard.writeText(await fileOutBlob.text());
  $("fileCopyStatus").textContent = msg("copie");
  $("fileCopyStatus").className = "status active";
  setTimeout(() => {
    $("fileCopyStatus").textContent = "";
  }, 4e3);
});
$("dragCard").addEventListener("click", () => {
  if (!fileOutBlob) return;
  window.parent.postMessage({ clarenceDeliverFile: { blob: fileOutBlob, name: fileOutName } }, "*");
  fileSetStatus("Envoi dans la page\u2026");
});
window.addEventListener("message", (ev) => {
  const result = ev.data && ev.data.clarenceDeliverResult;
  if (!result) return;
  fileSetStatus(
    result.delivered ? "Fichier transmis \xE0 la page \u2014 v\xE9rifie qu'il appara\xEEt bien avant d'envoyer." : "Aucun champ de fichier d\xE9tect\xE9 sur la page. Ouvre d'abord le menu \xAB joindre \xBB du site, ou utilise le t\xE9l\xE9chargement.",
    result.delivered ? "active" : "error"
  );
});
var dropzone = $("dropzone");
for (const evName of ["dragenter", "dragover"]) {
  dropzone.addEventListener(evName, (ev) => {
    ev.preventDefault();
    dropzone.classList.add("dragover");
  });
}
for (const evName of ["dragleave", "drop"]) {
  dropzone.addEventListener(evName, (ev) => {
    ev.preventDefault();
    dropzone.classList.remove("dragover");
  });
}
dropzone.addEventListener("drop", (ev) => {
  const file = ev.dataTransfer?.files?.[0];
  if (file) setChosenFile(file);
});
var barresDeProfil = /* @__PURE__ */ new Map();
var suggestionsEcartees = /* @__PURE__ */ new Set();
function montrerSuggestion({ prefixe, texte, entites }) {
  const barre = $(prefixe + "Suggest");
  if (!barre) return;
  barre.hidden = true;
  const bar = barresDeProfil.get(prefixe === "profile" ? "profileSelect" : "fileProfileSelect");
  if (!bar) return;
  const { type } = analyserTypeDocument(texte, { entites });
  const profil = type ? PROFIL_POUR_TYPE[type] : null;
  if (!profil || !bar.existe(profil) || bar.courant() === profil) return;
  if (suggestionsEcartees.has(type)) return;
  const actuel = bar.profil();
  if (actuel) {
    const deja = new Set(actuel.alwaysKeep.map((t) => t.toLowerCase()));
    if (motsDeForme(type).every((m) => deja.has(m))) return;
  }
  $(prefixe + "SuggestTxt").textContent = msg("suggestion_profil", [msg("format_" + type)]);
  $(prefixe + "SuggestApply").textContent = msg("appliquer_profil", [profil]);
  barre.hidden = false;
  $(prefixe + "SuggestApply").onclick = () => {
    bar.selectionner(profil);
    barre.hidden = true;
    setStatus(msg("profil_applique", [profil]), "ok");
  };
  $(prefixe + "SuggestDismiss").onclick = () => {
    suggestionsEcartees.add(type);
    barre.hidden = true;
  };
}
async function bindProfileBar(cfg) {
  const sel = $(cfg.selectId);
  if (!sel) return;
  let profiles = await loadProfiles();
  const refill = (selected) => {
    sel.innerHTML = '<option value="">(personnalis\xE9)</option>' + profiles.map((p) => `<option${p.name === selected ? " selected" : ""}>${esc(p.name)}</option>`).join("");
  };
  refill();
  barresDeProfil.set(cfg.selectId, {
    courant: () => sel.value,
    profil: () => profiles.find((p) => p.name === sel.value) || null,
    existe: (nom) => profiles.some((p) => p.name === nom),
    selectionner: (nom) => {
      const p = profiles.find((x) => x.name === nom);
      if (!p) return false;
      refill(nom);
      cfg.apply(p);
      return true;
    }
  });
  sel.addEventListener("change", () => {
    const p = profiles.find((x) => x.name === sel.value);
    if (p) cfg.apply(p);
  });
  $(cfg.saveId)?.addEventListener("click", async () => {
    let name = sel.value;
    if (!name) {
      name = (window.prompt("Nom du profil ?") || "").trim();
      if (!name) return;
    }
    profiles = await upsertProfile({ name, ...cfg.read() });
    refill(name);
  });
  $(cfg.newId)?.addEventListener("click", async () => {
    const name = (window.prompt("Nom du nouveau profil ?") || "").trim();
    if (!name) return;
    profiles = await upsertProfile({ name, ...cfg.read() });
    refill(name);
  });
  $(cfg.deleteId)?.addEventListener("click", async () => {
    if (!sel.value) return;
    if (!window.confirm(`Supprimer le profil \xAB ${sel.value} \xBB ?`)) return;
    profiles = await deleteProfile(sel.value);
    refill();
  });
}
bindProfileBar({
  selectId: "profileSelect",
  saveId: "profileSaveBtn",
  newId: "profileNewBtn",
  deleteId: "profileDeleteBtn",
  read: () => ({
    alwaysKeep: parseLines($("alwaysKeep")?.value),
    alwaysMask: parseLines($("alwaysMask")?.value),
    disabledTypes: [...disabledTypes],
    realistic: !!$("realisticToggle")?.checked
  }),
  apply: (p) => {
    if ($("alwaysKeep")) $("alwaysKeep").value = p.alwaysKeep.join("\n");
    if ($("alwaysMask")) $("alwaysMask").value = p.alwaysMask.join("\n");
    disabledTypes = new Set(p.disabledTypes);
    if ($("realisticToggle")) $("realisticToggle").checked = p.realistic;
    majSousOptions();
    rendreApercuTermes();
    renderTypeChips("typeToggles", disabledTypes);
    if (currentText) render();
  }
});
bindProfileBar({
  selectId: "fileProfileSelect",
  saveId: "fileProfileSaveBtn",
  newId: "fileProfileNewBtn",
  deleteId: "fileProfileDeleteBtn",
  read: () => ({
    alwaysKeep: parseLines($("fileAlwaysKeep")?.value),
    alwaysMask: parseLines($("fileAlwaysMask")?.value),
    disabledTypes: [...fileDisabledTypes],
    realistic: !!$("fileRealisticToggle")?.checked
  }),
  apply: (p) => {
    if ($("fileAlwaysKeep")) $("fileAlwaysKeep").value = p.alwaysKeep.join("\n");
    if ($("fileAlwaysMask")) $("fileAlwaysMask").value = p.alwaysMask.join("\n");
    fileDisabledTypes = new Set(p.disabledTypes);
    if ($("fileRealisticToggle")) $("fileRealisticToggle").checked = p.realistic;
    majSousOptions();
    rendreApercuTermes();
    renderTypeChips("fileTypeToggles", fileDisabledTypes);
  }
});
var identityCache = { status: "neuf", champs: {} };
function identityForceTerms() {
  return identitySearchTerms(identityCache);
}
function buildIdentityForm() {
  const wrap = $("identityFields");
  if (!wrap) return;
  const champ = ([key, label]) => `
    <div class="identity-field-${key}">
      <label class="field-label" for="identity_${key}">${esc(label)}</label>
      <textarea class="mini" id="identity_${key}" placeholder="Un terme par ligne"></textarea>
    </div>`;
  const essentiels = IDENTITY_FIELDS.filter(([k]) => IDENTITY_ESSENTIELS.has(k));
  const reste = IDENTITY_FIELDS.filter(([k]) => !IDENTITY_ESSENTIELS.has(k));
  const dejaRempli = reste.some(([k]) => (identityCache.champs[k] || []).length);
  wrap.innerHTML = `
    <div class="identity-essentiels">${essentiels.map(champ).join("")}</div>
    <details class="identity-reste"${dejaRempli ? " open" : ""}>
      <summary data-i18n="ajouter_emails_ecoles_employeurs">Ajouter emails, \xE9coles, employeurs, pseudos\u2026</summary>
      <div class="identity-fields">${reste.map(champ).join("")}</div>
    </details>`;
  appliquerTraductions(wrap);
}
function fillIdentityForm() {
  for (const [key] of IDENTITY_FIELDS) {
    const el = $(`identity_${key}`);
    if (el) el.value = (identityCache.champs[key] || []).join("\n");
  }
}
function readIdentityForm() {
  const champs = {};
  for (const [key] of IDENTITY_FIELDS) champs[key] = $(`identity_${key}`)?.value ?? "";
  return champs;
}
function openIdentityModal() {
  buildIdentityForm();
  fillIdentityForm();
  $("identityOverlay").hidden = false;
}
async function initIdentity() {
  identityCache = await loadIdentity();
  if (identityCache.status === "neuf") openIdentityModal();
}
$("identityOpenBtn")?.addEventListener("click", openIdentityModal);
$("identitySaveBtn")?.addEventListener("click", async () => {
  identityCache = { status: "configur\xE9", champs: readIdentityForm() };
  await saveIdentity(identityCache);
  identityCache = await loadIdentity();
  $("identityOverlay").hidden = true;
});
$("identityLaterBtn")?.addEventListener("click", async () => {
  identityCache = { ...identityCache, status: "refus\xE9" };
  await saveIdentity(identityCache);
  $("identityOverlay").hidden = true;
});
$("identityClearBtn")?.addEventListener("click", async () => {
  if (!window.confirm("Effacer toutes les informations d'identit\xE9 stock\xE9es ?")) return;
  await clearIdentity();
  identityCache = { status: "refus\xE9", champs: {} };
  await saveIdentity(identityCache);
  fillIdentityForm();
});
initIdentity();
