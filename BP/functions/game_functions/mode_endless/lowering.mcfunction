# = SCORES =
execute if score start endless matches 1 run scoreboard players add lift endless 1
execute if score reset endless matches 1 run scoreboard players remove lift endless 1
# = CORE EVENTS IN ORDER =
# = Players =
execute as @a[tag=endlesslift] at @s run tag @s add endless
execute as @a[tag=endless] at @s run tag @s remove endlesslift
execute as @a[tag=endless] at @s run tag @s remove lobby
execute if score start endless matches 1 if score lift endless matches 1 run scoreboard players operation p_game endless = p_lift endless
# // Create entity
execute if score start endless matches 1 if score lift endless matches 1 run summon brr:flood_room 76 -59 37 0 0 * endless
execute if score start endless matches 1 if score lift endless matches 1 run effect @e[type=brr:flood_room] water_breathing infinite 255 true
# // Lower door
execute if score lift endless matches 1 run structure load mystructure:EndlessDoor 27 25 35
execute if score lift endless matches 10 run structure load mystructure:EndlessDoor 27 24 35
execute if score lift endless matches 20 run structure load mystructure:EndlessDoor 27 23 35
execute if score lift endless matches 30 run structure load mystructure:EndlessDoor1 27 23 35
# // Open Door
execute if score lift endless matches -1 run tellraw @a {"rawtext":[{"text":"§9Endless Mode: §4All players died!"}]}
execute if score lift endless matches -1 run structure load mystructure:EndlessDoor 27 23 35
execute if score lift endless matches -10 run structure load mystructure:EndlessDoor 27 24 35
execute if score lift endless matches -20 run structure load mystructure:EndlessDoor 27 25 35
execute if score lift endless matches -30 run structure load mystructure:EndlessDoor 27 26 35
execute if score reset endless matches 1 if score lift endless matches -30 run function game_functions/mode_endless/reset
# // hmmmm
execute if score lift endless matches 30 run scoreboard players set started endless 1
# // change elevator status
execute if score lift endless matches 31.. if score start endless matches 1 run function game_functions/mode_endless/reset_room
execute if score lift endless matches 31.. run scoreboard players set start endless 2