# = SCORES =
execute if score easy_victory lobby matches 1 run scoreboard players add lift lobby 1
execute if score medium_victory lobby matches 1 run scoreboard players add lift lobby 1
execute if score hard_victory lobby matches 1 run scoreboard players add lift lobby 1
execute if score lift lobby matches 1.. unless score easy_victory lobby matches 1 unless score medium_victory lobby matches 1 unless score hard_victory lobby matches 1 run scoreboard players add lift lobby 1
# = SOUNDS =
execute if score lift lobby matches 1 if score easy_victory lobby matches 1 run structure load "easy:EasyVictory" -41 97 -20
execute if score lift lobby matches 1 if score medium_victory lobby matches 1 run structure load "medium:MediumVictory" -41 97 -20
execute if score lift lobby matches 1 if score hard_victory lobby matches 1 run structure load "hard:HardVictory" -41 97 -20
execute if score lift lobby matches 1 if score easy_victory lobby matches 1 positioned -35 94 -18 run playsound sfx.alarm.lift @a[r=15] -37 95 -18
execute if score lift lobby matches 1 if score medium_victory lobby matches 1 positioned -35 94 -18 run playsound sfx.alarm.lift @a[r=15] -37 95 -18
execute if score lift lobby matches 1 if score hard_victory lobby matches 1 positioned -35 94 -18 run playsound sfx.alarm.hard @a[r=15] -37 95 -18
execute if score lift lobby matches 110 if score easy_victory lobby matches 1 positioned -35 94 -18 run playsound sfx.alarm.lift @a[r=15] -37 95 -18
execute if score lift lobby matches 110 if score medium_victory lobby matches 1 positioned -35 94 -18 run playsound sfx.alarm.lift @a[r=15] -37 95 -18
execute if score lift lobby matches 110 if score hard_victory lobby matches 1 positioned -35 94 -18 run playsound sfx.alarm.hard @a[r=15] -37 95 -18
execute if score lift lobby matches 210 if score easy_victory lobby matches 1 positioned -35 94 -18 run playsound sfx.alarm.lift @a[r=15] -37 95 -18
execute if score lift lobby matches 210 if score medium_victory lobby matches 1 positioned -35 94 -18 run playsound sfx.alarm.lift @a[r=15] -37 95 -18
execute if score lift lobby matches 210 if score hard_victory lobby matches 1 positioned -35 94 -18 run playsound sfx.alarm.hard @a[r=15] -37 95 -18
# = ANIMATION =
# // Lift
execute if score lift lobby matches 1 run structure load "easy/exit_room:ExitBorderClosed" -41 103 -20
execute if score lift lobby matches 1 run structure load "easy/exit_room:ExitLift" -40 56 -19
execute if score lift lobby matches 1 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 6 run structure load "easy/exit_room:ExitLift" -40 57 -19
execute if score lift lobby matches 6 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 12 run structure load "easy/exit_room:ExitLift" -40 58 -19
execute if score lift lobby matches 12 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 18 run structure load "easy/exit_room:ExitLift" -40 59 -19
execute if score lift lobby matches 18 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 24 run structure load "easy/exit_room:ExitLift" -40 60 -19
execute if score lift lobby matches 24 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 30 run structure load "easy/exit_room:ExitLift" -40 61 -19
execute if score lift lobby matches 30 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 36 run structure load "easy/exit_room:ExitLift" -40 62 -19
execute if score lift lobby matches 36 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 42 run structure load "easy/exit_room:ExitLift" -40 63 -19
execute if score lift lobby matches 42 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 48 run structure load "easy/exit_room:ExitLift" -40 64 -19
execute if score lift lobby matches 48 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 54 run structure load "easy/exit_room:ExitLift" -40 65 -19
execute if score lift lobby matches 54 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 60 run structure load "easy/exit_room:ExitLift" -40 66 -19
execute if score lift lobby matches 60 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 66 run structure load "easy/exit_room:ExitLift" -40 67 -19
execute if score lift lobby matches 66 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 72 run structure load "easy/exit_room:ExitLift" -40 68 -19
execute if score lift lobby matches 72 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 78 run structure load "easy/exit_room:ExitLift" -40 69 -19
execute if score lift lobby matches 78 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 84 run structure load "easy/exit_room:ExitLift" -40 70 -19
execute if score lift lobby matches 84 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 90 run structure load "easy/exit_room:ExitLift" -40 71 -19
execute if score lift lobby matches 90 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 96 run structure load "easy/exit_room:ExitLift" -40 72 -19
execute if score lift lobby matches 96 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 102 run structure load "easy/exit_room:ExitLift" -40 73 -19
execute if score lift lobby matches 102 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 108 run structure load "easy/exit_room:ExitLift" -40 74 -19
execute if score lift lobby matches 108 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 114 run structure load "easy/exit_room:ExitLift" -40 75 -19
execute if score lift lobby matches 114 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 120 run structure load "easy/exit_room:ExitLift" -40 76 -19
execute if score lift lobby matches 120 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 128 run structure load "easy/exit_room:ExitLift" -40 77 -19
execute if score lift lobby matches 128 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 132 run structure load "easy/exit_room:ExitLift" -40 78 -19
execute if score lift lobby matches 132 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 138 run structure load "easy/exit_room:ExitLift" -40 79 -19
execute if score lift lobby matches 138 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 144 run structure load "easy/exit_room:ExitLift" -40 80 -19
execute if score lift lobby matches 144 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 150 run structure load "easy/exit_room:ExitLift" -40 81 -19
execute if score lift lobby matches 150 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 156 run structure load "easy/exit_room:ExitLift" -40 82 -19
execute if score lift lobby matches 156 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 162 run structure load "easy/exit_room:ExitLift" -40 83 -19
execute if score lift lobby matches 162 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 168 run structure load "easy/exit_room:ExitLift" -40 84 -19
execute if score lift lobby matches 168 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 174 run structure load "easy/exit_room:ExitLift" -40 85 -19
execute if score lift lobby matches 174 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 180 run structure load "easy/exit_room:ExitLift" -40 86 -19
execute if score lift lobby matches 180 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 186 run structure load "easy/exit_room:ExitLift" -40 87 -19
execute if score lift lobby matches 186 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 194 run structure load "easy/exit_room:ExitLift" -40 88 -19
execute if score lift lobby matches 194 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 200 run structure load "easy/exit_room:ExitLift" -40 89 -19
execute if score lift lobby matches 200 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 210 run structure load "easy/exit_room:ExitLift" -40 90 -19
execute if score lift lobby matches 210 as @a at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score lift lobby matches 210 positioned -35 94 -18 run playsound sfx.elevator.stop @a[r=15]
execute if score lift lobby matches 210 positioned -35 94 -18 run stopsound @a[r=15] sfx.elevator.move
execute if score lift lobby matches 210 run structure load "easy/exit_room:ExitBorderGone" -41 103 -20

# // barrier lifting up
execute if score lift lobby matches 210 positioned -35 94 -18 run playsound metal_door.pushbar @a[r=15] ~ ~ ~ 1 0.5
execute if score lift lobby matches 220 run structure load "lobby/animated:VictoryBarrier2" -36 92 -20
execute if score lift lobby matches 225 run structure load "lobby/animated:VictoryBarrier3" -36 92 -20
execute if score lift lobby matches 230 run structure load "lobby/animated:VictoryBarrier4" -36 92 -20
execute if score lift lobby matches 235 run structure load "lobby/animated:VictoryBarrier5" -36 92 -20
execute if score lift lobby matches 240 run structure load "lobby/animated:VictoryBarrier6" -36 92 -20
execute if score lift lobby matches 240 if score easy_victory lobby matches 1 run  scoreboard players set easy_victory lobby 0
execute if score lift lobby matches 240 if score medium_victory lobby matches 1 run  scoreboard players set medium_victory lobby 0
execute if score lift lobby matches 240 if score hard_victory lobby matches 1 run  scoreboard players set hard_victory lobby 0
# // barrier closing down
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run scoreboard players reset @s music
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s add lobby
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run gamemode a @s
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run scoreboard players reset @s music
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove spectator
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove easy
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove easy_music
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove easytunnel1
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove easytunnel2
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove easytunnel3
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove easytunnel4
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove easytunnel5
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove easylift
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove easylift2
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove medium
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove medium_music
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove mediumtunnel1
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove mediumtunnel2
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove mediumtunnel3
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove mediumtunnel4
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove mediumtunnel5
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove mediumlift
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove mediumlift2
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove hard
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove hard_music
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove hardtunnel1
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove hardtunnel2
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove hardtunnel3
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove hardtunnel4
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove hardtunnel5
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove hardlift
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove hardlift2
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove extreme
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove training
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove endless
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove endlesslift
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove endlesstunnel
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run tag @s remove endless_music
execute if score lift lobby matches 210 as @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] at @s run title @s times 20 80 20
execute if score lift lobby matches 300 run tp @a[x=-41, y=56, z=-20, dx=5, dy=70, dz=4] -35 92 -18
execute if score lift lobby matches 300 positioned -35 94 -18 run playsound metal_door.pushbar @a[r=15] ~ ~ ~ 1 0.5
execute if score lift lobby matches 300 run structure load "lobby/animated:VictoryBarrier5" -36 92 -20
execute if score lift lobby matches 305 run structure load "lobby/animated:VictoryBarrier4" -36 92 -20
execute if score lift lobby matches 310 run structure load "lobby/animated:VictoryBarrier3" -36 92 -20
execute if score lift lobby matches 315 run structure load "lobby/animated:VictoryBarrier2" -36 92 -20
execute if score lift lobby matches 320 run structure load "lobby/animated:VictoryBarrier1" -36 92 -20
execute if score lift lobby matches 300 run structure load "lobby/elevators:NoVictory" -41 97 -20
# // lift descend
execute if score lift lobby matches 340 positioned -35 94 -18 run playsound sfx.elevator.lift @a[r=15]
execute if score lift lobby matches 330 run structure load "easy/exit_room:ExitLift" -40 89 -19
execute if score lift lobby matches 340 run structure load "easy/exit_room:ExitLift" -40 88 -19
execute if score lift lobby matches 348 run structure load "easy/exit_room:ExitLift" -40 87 -19
execute if score lift lobby matches 354 run structure load "easy/exit_room:ExitLift" -40 86 -19
execute if score lift lobby matches 360 run structure load "easy/exit_room:ExitLift" -40 85 -19
execute if score lift lobby matches 365 run structure load "easy/exit_room:ExitLift" -40 84 -19
execute if score lift lobby matches 370 run structure load "easy/exit_room:ExitLift" -40 83 -19
execute if score lift lobby matches 375 run structure load "easy/exit_room:ExitLift" -40 82 -19
execute if score lift lobby matches 380 run structure load "easy/exit_room:ExitLift" -40 81 -19
execute if score lift lobby matches 382 run structure load "easy/exit_room:ExitLift" -40 80 -19
execute if score lift lobby matches 384 run structure load "easy/exit_room:ExitLift" -40 79 -19
execute if score lift lobby matches 386 run structure load "easy/exit_room:ExitLift" -40 78 -19
execute if score lift lobby matches 388 run structure load "easy/exit_room:ExitLift" -40 77 -19
execute if score lift lobby matches 390 run structure load "easy/exit_room:ExitLift" -40 76 -19
execute if score lift lobby matches 392 run structure load "easy/exit_room:ExitLift" -40 75 -19
execute if score lift lobby matches 394 run structure load "easy/exit_room:ExitLift" -40 74 -19
execute if score lift lobby matches 396 run structure load "easy/exit_room:ExitLift" -40 73 -19
execute if score lift lobby matches 398 run structure load "easy/exit_room:ExitLift" -40 72 -19
execute if score lift lobby matches 400 run structure load "easy/exit_room:ExitLift" -40 71 -19
execute if score lift lobby matches 402 run structure load "easy/exit_room:ExitLift" -40 70 -19
execute if score lift lobby matches 404 run structure load "easy/exit_room:ExitLift" -40 69 -19
execute if score lift lobby matches 406 run structure load "easy/exit_room:ExitLift" -40 68 -19
execute if score lift lobby matches 408 run structure load "easy/exit_room:ExitLift" -40 67 -19
execute if score lift lobby matches 410 run structure load "easy/exit_room:ExitLift" -40 66 -19
execute if score lift lobby matches 412 run structure load "easy/exit_room:ExitLift" -40 65 -19
execute if score lift lobby matches 414 run structure load "easy/exit_room:ExitLift" -40 64 -19
execute if score lift lobby matches 416 run structure load "easy/exit_room:ExitLift" -40 63 -19
execute if score lift lobby matches 418 run structure load "easy/exit_room:ExitLift" -40 62 -19
execute if score lift lobby matches 420 run structure load "easy/exit_room:ExitLift" -40 61 -19
execute if score lift lobby matches 422 run structure load "easy/exit_room:ExitLift" -40 60 -19
execute if score lift lobby matches 424 run structure load "easy/exit_room:ExitLift" -40 59 -19
execute if score lift lobby matches 426 run structure load "easy/exit_room:ExitLift" -40 58 -19
execute if score lift lobby matches 428 run structure load "easy/exit_room:ExitLift" -40 57 -19
execute if score lift lobby matches 430 run structure load "easy/exit_room:ExitLift" -40 56 -19
execute if score lift lobby matches 432 run fill -40 56 -19 -38 58 -17 air
execute if score lift lobby matches 432 run scoreboard players reset lift lobby