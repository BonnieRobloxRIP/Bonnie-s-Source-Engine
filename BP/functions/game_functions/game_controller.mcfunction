# = ELEVATOR TRIGGERS =
# // Easy
execute as @a[tag=lobby, tag=easylift2] at @s if score start easy matches 2 run title @s actionbar §2THERE'S A GAME CURRENTLY IN PROGRESS!
execute as @a[tag=lobby, tag=easylift2, hasitem={ item=brr:fe_spectate, quantity=0}] at @s if score start easy matches 2 run give @s brr:fe_spectate 1 0 {"minecraft:item_lock":{"mode": "lock_in_inventory"}}
execute as @a[tag=easylift, tag=!spectator] at @s unless entity @s[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§2Exiting Lift..."}]}
execute as @a[tag=easylift, tag=!spectator] at @s unless entity @s[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5] run tag @s remove easylift
execute as @a[tag=easylift2, tag=!spectator] at @s unless entity @s[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§2Exiting Lift..."}]}
execute as @a[tag=easylift2, tag=!spectator] at @s unless entity @s[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5] run tag @s remove easylift2
execute as @a[tag=!spectator] at @s if entity @s[x=5.5, y=89, z=49.5, dx=5, dy=3, dz=5] unless score start easy matches 1..2 run tag @s add easylift
execute as @a[tag=!spectator] at @s if entity @s[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5] if score start easy matches 1 unless score room1 easy matches 1.. run tag @s add easylift
execute as @a[tag=!spectator] at @s if entity @s[x=5.5, y=89, z=49.5, dx=5, dy=3, dz=5] if score start easy matches 2 run tag @s add easylift2
# // Medium
execute as @a[tag=lobby, tag=mediumlift2] at @s if score start medium matches 2 run title @s actionbar §eTHERE'S A GAME CURRENTLY IN PROGRESS!
execute as @a[tag=lobby, tag=mediumlift2, hasitem={ item=brr:fe_spectate, quantity=0}] at @s if score start medium matches 2 run give @s brr:fe_spectate 1 0 {"minecraft:item_lock":{"mode": "lock_in_inventory"}}
execute as @a[tag=mediumlift, tag=!spectator] at @s unless entity @s[x=-2.5, y=23, z=50.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§eExiting Lift..."}]}
execute as @a[tag=mediumlift, tag=!spectator] at @s unless entity @s[x=-2.5, y=23, z=50.5, dx=5, dy=68, dz=5] run tag @s remove mediumlift
execute as @a[tag=mediumlift2, tag=!spectator] at @s unless entity @s[x=-2.5, y=23, z=50.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§eExiting Lift..."}]}
execute as @a[tag=mediumlift2, tag=!spectator] at @s unless entity @s[x=-2.5, y=23, z=50.5, dx=5, dy=68, dz=5] run tag @s remove mediumlift2
execute as @a[tag=!spectator] at @s if entity @s[x=-2.5, y=89, z=50.5, dx=5, dy=3, dz=5] unless score start medium matches 1..2 run tag @s add mediumlift
execute as @a[tag=!spectator] at @s if entity @s[x=-2.5, y=23, z=50.5, dx=5, dy=68, dz=5] if score start medium matches 1 unless score room1 medium matches 1.. run tag @s add mediumlift
execute as @a[tag=!spectator] at @s if entity @s[x=-2.5, y=89, z=50.5, dx=5, dy=3, dz=5] if score start medium matches 2 run tag @s add mediumlift2
# // Hard
execute as @a[tag=lobby, tag=hardlift2] at @s if score start hard matches 2 run title @s actionbar §4THERE'S A GAME CURRENTLY IN PROGRESS!
execute as @a[tag=lobby, tag=hardlift2, hasitem={ item=brr:fe_spectate, quantity=0}] at @s if score start hard matches 2 run give @s brr:fe_spectate 1 0 {"minecraft:item_lock":{"mode": "lock_in_inventory"}}
execute as @a[tag=hardlift, tag=!spectator] at @s unless entity @s[x=-10.5, y=23, z=49.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§4Exiting Lift..."}]}
execute as @a[tag=hardlift, tag=!spectator] at @s unless entity @s[x=-10.5, y=23, z=49.5, dx=5, dy=68, dz=5] run tag @s remove hardlift
execute as @a[tag=hardlift2, tag=!spectator] at @s unless entity @s[x=-10.5, y=23, z=49.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§4Exiting Lift..."}]}
execute as @a[tag=hardlift2, tag=!spectator] at @s unless entity @s[x=-10.5, y=23, z=49.5, dx=5, dy=68, dz=5] run tag @s remove hardlift2
execute as @a[tag=!spectator] at @s if entity @s[x=-10.5, y=89, z=49.5, dx=5, dy=3, dz=5] unless score start hard matches 1..2 run tag @s add hardlift
execute as @a[tag=!spectator] at @s if entity @s[x=-10.5, y=23, z=49.5, dx=5, dy=68, dz=5] if score start hard matches 1 unless score room1 hard matches 1.. run tag @s add hardlift
execute as @a[tag=!spectator] at @s if entity @s[x=-10.5, y=89, z=49.5, dx=5, dy=3, dz=5] if score start hard matches 2 run tag @s add hardlift2
# // Extreme Challenge 1
execute as @a[tag=lobby, tag=extremechallenge1lift2] at @s if score start extremechallenge1 matches 2 run title @s actionbar §5§lTHERE'S A GAME CURRENTLY IN PROGRESS!
execute as @a[tag=lobby, tag=extremechallenge1lift2, hasitem={ item=brr:fe_spectate, quantity=0}] at @s if score start extremechallenge1 matches 2 run give @s brr:fe_spectate 1 0 {"minecraft:item_lock":{"mode": "lock_in_inventory"}}
execute as @a[tag=extremechallenge1lift, tag=!spectator] at @s unless entity @s[x=-80.5, y=80, z=19.5, dx=5, dy=5, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§5§lExiting Lift..."}]}
execute as @a[tag=extremechallenge1lift, tag=!spectator] at @s unless entity @s[x=-80.5, y=80, z=19.5, dx=5, dy=5, dz=5] run tag @s remove extremechallenge1lift
execute as @a[tag=extremechallenge1lift2, tag=!spectator] at @s unless entity @s[x=-80.5, y=80, z=19.5, dx=5, dy=5, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§5§lExiting Lift..."}]}
execute as @a[tag=extremechallenge1lift2, tag=!spectator] at @s unless entity @s[x=-80.5, y=80, z=19.5, dx=5, dy=5, dz=5] run tag @s remove extremechallenge1lift2
execute as @a[tag=!spectator] at @s if entity @s[x=-80.5, y=80, z=19.5, dx=5, dy=5, dz=5] unless score start extremechallenge1 matches 1..2 run tag @s add extremechallenge1lift
execute as @a[tag=!spectator] at @s if entity @s[x=-80.5, y=80, z=19.5, dx=5, dy=5, dz=5] if score start extremechallenge1 matches 1 unless score room1 extremechallenge1 matches 1.. run tag @s add extremechallenge1lift
execute as @a[tag=!spectator] at @s if entity @s[x=-80.5, y=80, z=19.5, dx=5, dy=5, dz=5] if score start extremechallenge1 matches 2 run tag @s add extremechallenge1lift2
# // Endless
execute as @a[tag=endlesslift, tag=!spectator] at @s unless entity @s[x=29.5, y=23, z=35.5, dx=5, dy=5, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§9Exiting Lift..."}]}
execute as @a[tag=endlesslift, tag=!spectator] at @s unless entity @s[x=29.5, y=23, z=35.5, dx=5, dy=5, dz=5] run tag @s remove endlesslift
execute as @a[tag=!spectator] at @s if entity @s[x=29.5, y=23, z=35.5, dx=5, dy=5, dz=5] unless score start endless matches 1.. unless score started endless matches 1.. run tag @s add endlesslift
# = SCORES =
# // Easy
scoreboard players set p_lift easy 0
execute as @a[tag=easylift] at @s run scoreboard players add p_lift easy 1
execute if score p_lift easy matches 1.. if score start easy matches 0 run scoreboard players add timer_ms easy 1
execute if score timer_ms easy matches 20.. if score start easy matches 0 run scoreboard players remove timer_s easy 1
execute if score timer_s easy matches 0 if score timer_ms easy matches 20.. run scoreboard players set start easy 1
execute if score timer_ms easy matches 20.. run scoreboard players set timer_ms easy 0
execute if score p_lift easy matches 0 run scoreboard players set timer_ms easy 19
execute if score p_lift easy matches 0 run scoreboard players set timer_s easy 10
# // Medium
scoreboard players set p_lift medium 0
execute as @a[tag=mediumlift] at @s run scoreboard players add p_lift medium 1
execute if score p_lift medium matches 1.. if score start medium matches 0 run scoreboard players add timer_ms medium 1
execute if score timer_ms medium matches 20.. if score start medium matches 0 run scoreboard players remove timer_s medium 1
execute if score timer_s medium matches 0 if score timer_ms medium matches 20.. run scoreboard players set start medium 1
execute if score timer_ms medium matches 20.. run scoreboard players set timer_ms medium 0
execute if score p_lift medium matches 0 run scoreboard players set timer_ms medium 19
execute if score p_lift medium matches 0 run scoreboard players set timer_s medium 10
# // Hard
scoreboard players set p_lift hard 0
execute as @a[tag=hardlift] at @s run scoreboard players add p_lift hard 1
execute if score p_lift hard matches 1.. if score start hard matches 0 run scoreboard players add timer_ms hard 1
execute if score timer_ms hard matches 20.. if score start hard matches 0 run scoreboard players remove timer_s hard 1
execute if score timer_s hard matches 0 if score timer_ms hard matches 20.. run scoreboard players set start hard 1
execute if score timer_ms hard matches 20.. run scoreboard players set timer_ms hard 0
execute if score p_lift hard matches 0 run scoreboard players set timer_ms hard 19
execute if score p_lift hard matches 0 run scoreboard players set timer_s hard 10
# // Extreme

# // Extreme Challenge 1
scoreboard players set p_lift extremechallenge1 0
execute as @a[tag=extremechallenge1lift] at @s run scoreboard players add p_lift extremechallenge1 1
execute if score p_lift extremechallenge1 matches 1.. if score start extremechallenge1 matches 0 run scoreboard players add timer_ms extremechallenge1 1
execute if score timer_ms extremechallenge1 matches 20.. if score start extremechallenge1 matches 0 run scoreboard players remove timer_s extremechallenge1 1
execute if score timer_s extremechallenge1 matches 0 if score timer_ms extremechallenge1 matches 20.. run scoreboard players set start extremechallenge1 1
execute if score timer_ms extremechallenge1 matches 20.. run scoreboard players set timer_ms extremechallenge1 0
execute if score p_lift extremechallenge1 matches 0 run scoreboard players set timer_ms extremechallenge1 19
execute if score p_lift extremechallenge1 matches 0 run scoreboard players set timer_s extremechallenge1 10
# // Extreme Challenge 2

# // Endless
scoreboard players set p_lift endless 0
execute as @a[tag=endlesslift] at @s run scoreboard players add p_lift endless 1
execute if score p_lift endless matches 1.. if score start endless matches 0 run scoreboard players add timer_ms endless 1
execute if score timer_ms endless matches 20.. if score start endless matches 0 run scoreboard players remove timer_s endless 1
execute if score timer_s endless matches 0 if score timer_ms endless matches 20.. run scoreboard players set start endless 1
execute if score timer_ms endless matches 20.. run scoreboard players set timer_ms endless 0
execute if score p_lift endless matches 0 run scoreboard players set timer_ms endless 19
execute if score p_lift endless matches 0 run scoreboard players set timer_s endless 10
# = EXECUTORS =
# // Easy
execute if score start easy matches 1 run function game_functions/mode_easy/lowering
execute if score reset easy matches 1 run function game_functions/mode_easy/lowering
# // Medium
execute if score start medium matches 1 run function game_functions/mode_medium/lowering
execute if score reset medium matches 1 run function game_functions/mode_medium/lowering
# // Hard
execute if score start hard matches 1 run function game_functions/mode_hard/lowering
execute if score reset hard matches 1 run function game_functions/mode_hard/lowering
# // Extreme
execute if score start extremechallenge1 matches 1 if score challenge extremechallenge1 matches 1 run function game_functions/mode_extreme/room_challenge/insulated_exoplanet/lowering
execute if score reset extremechallenge1 matches 1 run function game_functions/mode_extreme/room_challenge/insulated_exoplanet/lowering
# // Endless
execute if score start endless matches 1 run function game_functions/mode_endless/lowering
execute if score reset endless matches 1 run function game_functions/mode_endless/lowering
# = PLAYERCOUNTS =
# // Easy
execute if score started easy matches 1 run scoreboard players set p_game easy 0
execute as @a[tag=easy] at @s if score started easy matches 1 run scoreboard players add p_game easy 1
# // Medium
execute if score started medium matches 1 run scoreboard players set p_game medium 0
execute as @a[tag=medium] at @s if score started medium matches 1 run scoreboard players add p_game medium 1
# // Hard
execute if score started hard matches 1 run scoreboard players set p_game hard 0
execute as @a[tag=hard] at @s if score started hard matches 1 run scoreboard players add p_game hard 1
# // Extreme
execute if score started extreme matches 1 run scoreboard players set p_game extreme 0
execute as @a[tag=extreme] at @s if score started extreme matches 1 run scoreboard players add p_game extreme 1
# // Extreme Challenge 1
execute if score started extremechallenge1 matches 1 run scoreboard players set p_game extremechallenge1 0
execute as @a[tag=extremechallenge1] at @s if score started extremechallenge1 matches 1 run scoreboard players add p_game extremechallenge1 1
# // Extreme Challenge 2
execute if score started extremechallenge2 matches 1 run scoreboard players set p_game extremechallenge2 0
execute as @a[tag=extremechallenge2] at @s if score started extremechallenge2 matches 1 run scoreboard players add p_game extremechallenge2 1
# // Endless
execute if score started endless matches 1 run scoreboard players set p_game endless 0
execute as @a[tag=endless] at @s if score started endless matches 1 run scoreboard players add p_game endless 1
# = RESET =
# // Manual reset: setting "reset <mode>" to 1 while the mode is idle or still lowering resets it straight away.
# // (During a game, the lift rewinds and the mode resets once everyone is out, as before.)
execute if score reset easy matches 1 unless score start easy matches 2 run function game_functions/mode_easy/reset
execute if score reset medium matches 1 unless score start medium matches 2 run function game_functions/mode_medium/reset
execute if score reset hard matches 1 unless score start hard matches 2 run function game_functions/mode_hard/reset
execute if score reset endless matches 1 unless score start endless matches 2 run function game_functions/mode_endless/reset
# // Easy
execute if score start easy matches 2 if score p_game easy matches 0 if score reset easy matches 0 run scoreboard players set lift easy 0
execute if score start easy matches 2 if score p_game easy matches 0 if score reset easy matches 0 run scoreboard players set reset easy 1
execute if score reset easy matches 1 if score lift easy matches -1 if score start easy matches 2 if score p_game easy < p_amount easy unless score p_won easy matches 1.. run tellraw @a {"rawtext":[{"text": "§2Easy Mode: §4All Players Died!"}]}
execute if score reset easy matches 1 if score lift easy matches -1 if score start easy matches 2 if score p_won easy < p_amount easy unless score p_won easy = p_amount easy if score p_game easy matches 1.. run tellraw @a {"rawtext":[{"text": "§2Easy Mode: §6Some Players Escaped!"}]}
execute if score reset easy matches 1 if score lift easy matches -1 if score start easy matches 2 if score p_won easy = p_amount easy run tellraw @a {"rawtext":[{"text": "§2Easy Mode: §aAll Players Escaped!"}]}
# // Medium
execute if score start medium matches 2 if score p_game medium matches 0 if score reset medium matches 0 run scoreboard players set lift medium 0
execute if score start medium matches 2 if score p_game medium matches 0 if score reset medium matches 0 run scoreboard players set reset medium 1
execute if score reset medium matches 1 if score lift medium matches -1 if score start medium matches 2 if score p_game medium < p_amount medium unless score p_won medium matches 1.. run tellraw @a {"rawtext":[{"text": "§eMedium Mode: §4All Players Died!"}]}
execute if score reset medium matches 1 if score lift medium matches -1 if score start medium matches 2 if score p_won medium < p_amount medium unless score p_won medium = p_amount medium if score p_game medium matches 1.. run tellraw @a {"rawtext":[{"text": "§eMedium Mode: §6Some Players Escaped!"}]}
execute if score reset medium matches 1 if score lift medium matches -1 if score start medium matches 2 if score p_won medium = p_amount medium run tellraw @a {"rawtext":[{"text": "§eMedium Mode: §aAll Players Escaped!"}]}
# // Hard
execute if score start hard matches 2 if score p_game hard matches 0 if score reset hard matches 0 run scoreboard players set lift hard 0
execute if score start hard matches 2 if score p_game hard matches 0 if score reset hard matches 0 run scoreboard players set reset hard 1
execute if score reset hard matches 1 if score lift hard matches -1 if score start hard matches 2 if score p_game hard < p_amount hard unless score p_won hard matches 1.. run tellraw @a {"rawtext":[{"text": "§4§lHard Mode: §r§4All Players Died!"}]}
execute if score reset hard matches 1 if score lift hard matches -1 if score start hard matches 2 if score p_won hard < p_amount hard unless score p_won hard = p_amount hard if score p_game hard matches 1.. run tellraw @a {"rawtext":[{"text": "§4§lHard Mode: §r§6Some Players Escaped!"}]}
execute if score reset hard matches 1 if score lift hard matches -1 if score start hard matches 2 if score p_won hard = p_amount hard run tellraw @a {"rawtext":[{"text": "§4§lHard Mode: §r§aAll Players Escaped!"}]}
# // Extreme

# // Endless
execute if score start endless matches 2 if score p_game endless matches 0 if score reset endless matches 0 run scoreboard players set lift endless 0
execute if score start endless matches 2 if score p_game endless matches 0 if score reset endless matches 0 run scoreboard players set reset endless 1
# = TEMPORARY =
execute as @a[tag=easytunnel4] at @s run scoreboard players add @s storage_easy 1
execute as @a[tag=easytunnel4] at @s run scoreboard players add p_won easy 1
execute as @a[tag=easytunnel4] at @s run tellraw @a {"rawtext":[{"text": "§a§lEasy mode:§b "}, {"selector": "@s"}, {"text": " §r§2Escaped the Facility!"}]}
execute as @a[tag=easytunnel4] at @s run tag @s add craftalog_badge_easy_win
execute as @a[tag=easytunnel4] at @s run tp @s 0 86 -16

execute as @a[tag=mediumtunnel3] at @s run scoreboard players add @s storage_medium 1
execute as @a[tag=mediumtunnel3] at @s run scoreboard players add p_won medium 1
execute as @a[tag=mediumtunnel3] at @s run tellraw @a {"rawtext":[{"text": "§e§lMedium mode:§b "}, {"selector": "@s"}, {"text": " §r§6Escaped the Facility!"}]}
execute as @a[tag=mediumtunnel3] at @s run tag @s add craftalog_badge_medium_win
execute as @a[tag=mediumtunnel3] at @s run tp @s 0 86 -16

execute as @a[tag=hardtunnel3] at @s run scoreboard players add @s storage_hard 1
execute as @a[tag=hardtunnel3] at @s run scoreboard players add p_won hard 1
execute as @a[tag=hardtunnel3] at @s run tellraw @a {"rawtext":[{"text": "§4§lHard mode:§b "}, {"selector": "@s"}, {"text": " §r§4Escaped the Facility!"}]}
execute as @a[tag=hardtunnel3] at @s run tag @s add craftalog_badge_hard_win
execute as @a[tag=hardtunnel3] at @s run tp @s 0 86 -16

# // craftalog
#difficulty peaceful