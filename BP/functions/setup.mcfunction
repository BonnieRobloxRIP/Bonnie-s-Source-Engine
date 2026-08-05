gamerule commandblockoutput false
gamerule commandblocksenabled true
gamerule dodaylightcycle false
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
setworldspawn 0 1 -1
clearspawnpoint @a
fill -16 -64 -16 16 -64 16 air
setblock 0 0 0 brr:dev_measuregeneric02
tp @a 0 1 0
execute as @s at @s run fill ~15 ~-1 ~15 ~-15 ~-1 ~-15 brr:dev_measuregeneric02
execute as @s at @s run setblock ~ ~-1 ~ brr:dev_measuregeneric01
tag @s add host
tellraw @s {"rawtext":[{"text": "You are now the host of the world! the tag 'host' has been added to you"}]}
tellraw @s {"rawtext":[{"text": "This world has been successfully setted up with all gamerules under my own personal preferences! enjoy C: (this function should be used only for flat void worlds)"}]}