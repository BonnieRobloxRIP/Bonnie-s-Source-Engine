# = ESSENTIALS =
gamerule commandblockoutput false
gamerule commandblocksenabled true
gamerule dodaylightcycle true
gamerule doentitydrops false
gamerule dofiretick false
gamerule doimmediaterespawn true
gamerule dolimitedcrafting false
gamerule domobloot false
gamerule domobspawning false
gamerule dotiledrops false
gamerule doweathercycle false
gamerule drowningdamage true
gamerule falldamage false
gamerule firedamage true
gamerule freezedamage true
gamerule keepinventory true
gamerule mobgriefing false
gamerule naturalregeneration true
gamerule pvp false
gamerule randomtickspeed 0
gamerule spawnradius 0
gamerule showbordereffect false
gamerule showcoordinates true
gamerule showdaysplayed false
gamerule showdeathmessages false
gamerule showtags false
gamerule sendcommandfeedback false
gamerule tntexplodes false
gamerule respawnblocksexplode false
gamerule recipesunlock false
gamerule doinsomnia false
gamerule showrecipemessages false
gamerule locatorbar false
difficulty peaceful
time set 250
setworldspawn 0 86 -16
clearspawnpoint @a
#fill -16 -64 -16 16 -64 16 air
tp @a 0 86 -16
# = MAP SPECIFIC =
# // scores
scoreboard objectives add lobby dummy
scoreboard objectives add music dummy
scoreboard objectives add easy dummy
scoreboard objectives add medium dummy
scoreboard objectives add hard dummy
scoreboard objectives add extreme dummy
scoreboard objectives add training dummy
scoreboard objectives add endless dummy
# // player scores
scoreboard objectives add storage_easy dummy
scoreboard objectives add storage_medium dummy
scoreboard objectives add storage_hard dummy
scoreboard objectives add storage_extreme dummy
scoreboard objectives add storage_endless dummy
scoreboard objectives add display_easy dummy "§a§lEasy Mode Wins"
scoreboard objectives add display_medium dummy "§e§lMedium Mode Wins"
scoreboard objectives add display_hard dummy "§4§lHard Mode Wins"
scoreboard objectives add display_extreme dummy "§5§lExtreme Mode Wins"
scoreboard objectives add display_endless dummy "§9§lEndless Mode Ranking"
# // begin
function game_functions/mode_easy/reset
