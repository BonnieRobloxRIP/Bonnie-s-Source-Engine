# = SCORES =
execute if score start medium matches 1 run scoreboard players add lift medium 1
execute if score start medium matches 1 run scoreboard players add alarm medium 1
execute if score reset medium matches 1 run scoreboard players remove lift medium 1
# = CORE EVENTS IN ORDER =
# // - sound effects -
execute if score lift medium matches 1 run playsound sfx.alarm.lift @a 0 91 53
# // silo door open
execute if score lift medium matches 720 run playsound silo_door.open @a 0 -34 31
execute if score lift medium matches 840 run stopsound @a silo_door.open
execute if score lift medium matches 840 run playsound silo_door.opened @a 0 -35 31
# // silo door close
execute if score lift medium matches 1044 run playsound silo_door.open @a 0 -34 31
execute if score lift medium matches 1104 run stopsound @a silo_door.open
execute if score lift medium matches 1104 run playsound silo_door.opened @a 0 -35 31
# // - lift door -
# // shut the main door (as if it matters lol, they can jump over it)
execute if score lift medium matches 1 run structure load "medium:MediumLiftDoor2" -2 89 50
execute if score lift medium matches 15 run structure load "medium:MediumLiftDoor1" -2 89 50
# // open the door after the lift has risen again
execute if score lift medium matches 1680 run structure load "medium:MediumLiftDoor2" -2 89 50
execute if score lift medium matches 1700 run structure load "medium:MediumLiftDoor3" -2 89 50
# // lower the elevator
execute if score lift medium matches 25 positioned 0 89 53 run playsound sfx.elevator.lift @a[r=20] ~ ~ ~
execute if score lift medium matches 25 run playsound sfx.elevator.move @a[tag=mediumlift]
execute if score lift medium matches 25 run structure load "lobby/elevators:MainElevator" -2 86 51
execute if score lift medium matches 45 run structure load "lobby/elevators:MainElevator" -2 85 51
execute if score lift medium matches 55 run structure load "lobby/elevators:MainElevator" -2 84 51
execute if score lift medium matches 65 run structure load "lobby/elevators:MainElevator" -2 83 51
execute if score lift medium matches 75 run structure load "lobby/elevators:MainElevator" -2 82 51
execute if score lift medium matches 84 run structure load "lobby/elevators:MainElevator" -2 81 51
execute if score lift medium matches 92 run structure load "lobby/elevators:MainElevator" -2 80 51
execute if score lift medium matches 100 run structure load "lobby/elevators:MainElevator" -2 79 51
execute if score lift medium matches 105 run structure load "lobby/elevators:MainElevator" -2 78 51
execute if score lift medium matches 110 run structure load "lobby/elevators:MainElevator" -2 77 51
execute if score lift medium matches 115 run structure load "lobby/elevators:MainElevator" -2 76 51
execute if score lift medium matches 120 run structure load "lobby/elevators:MainElevator" -2 75 51
execute if score lift medium matches 124 run structure load "lobby/elevators:MainElevator" -2 74 51
execute if score lift medium matches 128 run structure load "lobby/elevators:MainElevator" -2 73 51
execute if score lift medium matches 132 run structure load "lobby/elevators:MainElevator" -2 72 51
execute if score lift medium matches 136 run structure load "lobby/elevators:MainElevator" -2 71 51
execute if score lift medium matches 140 run structure load "lobby/elevators:MainElevator" -2 70 51
execute if score lift medium matches 144 run structure load "lobby/elevators:MainElevator" -2 69 51
execute if score lift medium matches 148 run structure load "lobby/elevators:MainElevator" -2 68 51
execute if score lift medium matches 152 run structure load "lobby/elevators:MainElevator" -2 67 51
execute if score lift medium matches 156 run structure load "lobby/elevators:MainElevator" -2 66 51
execute if score lift medium matches 160 run structure load "lobby/elevators:MainElevator" -2 65 51
execute if score lift medium matches 163 run structure load "lobby/elevators:MainElevator" -2 64 51
execute if score lift medium matches 166 run structure load "lobby/elevators:MainElevator" -2 63 51
execute if score lift medium matches 169 run structure load "lobby/elevators:MainElevator" -2 62 51
execute if score lift medium matches 172 run structure load "lobby/elevators:MainElevator" -2 61 51
execute if score lift medium matches 175 run structure load "lobby/elevators:MainElevator" -2 60 51
execute if score lift medium matches 178 run structure load "lobby/elevators:MainElevator" -2 59 51
execute if score lift medium matches 181 run structure load "lobby/elevators:MainElevator" -2 58 51
execute if score lift medium matches 184 run structure load "lobby/elevators:MainElevator" -2 57 51
execute if score lift medium matches 187 run structure load "lobby/elevators:MainElevator" -2 56 51
execute if score lift medium matches 190 run structure load "lobby/elevators:MainElevator" -2 55 51
execute if score lift medium matches 193 run structure load "lobby/elevators:MainElevator" -2 54 51
execute if score lift medium matches 196 run structure load "lobby/elevators:MainElevator" -2 53 51
execute if score lift medium matches 199 run structure load "lobby/elevators:MainElevator" -2 52 51
execute if score lift medium matches 201 run structure load "lobby/elevators:MainElevator" -2 51 51
execute if score lift medium matches 203 run structure load "lobby/elevators:MainElevator" -2 50 51
execute if score lift medium matches 205 run structure load "lobby/elevators:MainElevator" -2 49 51
execute if score lift medium matches 207 run structure load "lobby/elevators:MainElevator" -2 48 51
execute if score lift medium matches 209 run structure load "lobby/elevators:MainElevator" -2 47 51
execute if score lift medium matches 211 run structure load "lobby/elevators:MainElevator" -2 46 51
execute if score lift medium matches 213 run structure load "lobby/elevators:MainElevator" -2 45 51
execute if score lift medium matches 215 run structure load "lobby/elevators:MainElevator" -2 44 51
execute if score lift medium matches 217 run structure load "lobby/elevators:MainElevator" -2 43 51
execute if score lift medium matches 219 run structure load "lobby/elevators:MainElevator" -2 42 51
execute if score lift medium matches 221 run structure load "lobby/elevators:MainElevator" -2 41 51
execute if score lift medium matches 223 run structure load "lobby/elevators:MainElevator" -2 40 51
execute if score lift medium matches 225 run structure load "lobby/elevators:MainElevator" -2 39 51
execute if score lift medium matches 227 run structure load "lobby/elevators:MainElevator" -2 38 51
execute if score lift medium matches 229 run structure load "lobby/elevators:MainElevator" -2 37 51
execute if score lift medium matches 231 run structure load "lobby/elevators:MainElevator" -2 36 51
execute if score lift medium matches 233 run structure load "lobby/elevators:MainElevator" -2 35 51
execute if score lift medium matches 235 run structure load "lobby/elevators:MainElevator" -2 34 51
execute if score lift medium matches 237 run structure load "lobby/elevators:MainElevator" -2 33 51
execute if score lift medium matches 239 run structure load "lobby/elevators:MainElevator" -2 32 51
execute if score lift medium matches 241 run structure load "lobby/elevators:MainElevator" -2 31 51
execute if score lift medium matches 243 run structure load "lobby/elevators:MainElevator" -2 30 51
execute if score lift medium matches 245 run structure load "lobby/elevators:MainElevator" -2 29 51
execute if score lift medium matches 247 run structure load "lobby/elevators:MainElevator" -2 28 51
execute if score lift medium matches 249 run structure load "lobby/elevators:MainElevator" -2 27 51
execute if score lift medium matches 251 run structure load "lobby/elevators:MainElevator" -2 26 51
execute if score lift medium matches 253 run structure load "lobby/elevators:MainElevator" -2 25 51
execute if score lift medium matches 255 run structure load "lobby/elevators:MainElevator" -2 24 51
execute if score lift medium matches 257 run structure load "lobby/elevators:MainElevator" -2 23 51
execute if score lift medium matches 259 run structure load "lobby/elevators:MainElevator" -2 22 51
execute if score lift medium matches 261 run structure load "lobby/elevators:MainElevator" -2 21 51
# // - entering the gamemode shaft -
execute if score lift medium matches 263 run function game_functions/mode_medium/decider
execute if score lift medium matches 263 run structure load "lobby/elevators:MainElevator" -2 20 51
execute if score lift medium matches 265 run structure load "lobby/elevators:MainElevator" -2 19 51
execute if score lift medium matches 267 run structure load "lobby/elevators:MainElevator" -2 18 51
execute if score lift medium matches 269 run structure load "lobby/elevators:MainElevator" -2 17 51
execute if score lift medium matches 272 run structure load "lobby/elevators:MainElevator" -2 16 51
execute if score lift medium matches 275 run structure load "lobby/elevators:MainElevator" -2 15 51
execute if score lift medium matches 278 run structure load "lobby/elevators:MainElevator" -2 14 51
execute if score lift medium matches 282 run structure load "lobby/elevators:MainElevator" -2 13 51
execute if score lift medium matches 286 run structure load "lobby/elevators:MainElevator" -2 12 51
execute if score lift medium matches 290 run structure load "lobby/elevators:MainElevator" -2 11 51
execute if score lift medium matches 294 run structure load "lobby/elevators:MainElevator" -2 10 51
execute if score lift medium matches 298 run structure load "lobby/elevators:MainElevator" -2 9 51
execute if score lift medium matches 302 run structure load "lobby/elevators:MainElevator" -2 8 51
execute if score lift medium matches 306 run structure load "lobby/elevators:MainElevator" -2 7 51
execute if score lift medium matches 310 run structure load "lobby/elevators:MainElevator" -2 6 51
execute if score lift medium matches 314 run structure load "lobby/elevators:MainElevator" -2 5 51
execute if score lift medium matches 318 run structure load "lobby/elevators:MainElevator" -2 4 51
execute if score lift medium matches 322 run structure load "lobby/elevators:MainElevator" -2 3 51
execute if score lift medium matches 326 run structure load "lobby/elevators:MainElevator" -2 2 51
execute if score lift medium matches 330 run structure load "lobby/elevators:MainElevator" -2 1 51
execute if score lift medium matches 334 run structure load "lobby/elevators:MainElevator" -2 0 51
execute if score lift medium matches 338 run structure load "lobby/elevators:MainElevator" -2 -1 51
execute if score lift medium matches 343 run structure load "lobby/elevators:MainElevator" -2 -2 51
execute if score lift medium matches 348 run structure load "lobby/elevators:MainElevator" -2 -3 51
execute if score lift medium matches 353 run structure load "lobby/elevators:MainElevator" -2 -4 51
execute if score lift medium matches 358 run structure load "lobby/elevators:MainElevator" -2 -5 51
execute if score lift medium matches 363 run structure load "lobby/elevators:MainElevator" -2 -6 51
execute if score lift medium matches 368 run structure load "lobby/elevators:MainElevator" -2 -7 51
execute if score lift medium matches 373 run structure load "lobby/elevators:MainElevator" -2 -8 51
execute if score lift medium matches 378 run structure load "lobby/elevators:MainElevator" -2 -9 51
execute if score lift medium matches 383 run structure load "lobby/elevators:MainElevator" -2 -10 51
execute if score lift medium matches 388 run structure load "lobby/elevators:MainElevator" -2 -11 51
execute if score lift medium matches 395 run structure load "lobby/elevators:MainElevator" -2 -12 51
execute if score lift medium matches 405 run structure load "lobby/elevators:MainElevator" -2 -13 51
execute if score lift medium matches 415 run structure load "lobby/elevators:MainElevator" -2 -14 51
execute if score lift medium matches 425 run structure load "lobby/elevators:MainElevator" -2 -15 51
# // - de-attaching from the main falls -
execute if score lift medium matches 430 run stopsound @a[tag=medium] sfx.elevator.move
execute if score lift medium matches 430 run playsound sfx.elevator.stop @a[tag=medium]
execute if score lift medium matches 430 run particle minecraft:critical_hit_emitter -2 -11 51
execute if score lift medium matches 430 run particle minecraft:critical_hit_emitter -2 -11 55
execute if score lift medium matches 430 run particle minecraft:critical_hit_emitter 2 -11 51
execute if score lift medium matches 430 run particle minecraft:critical_hit_emitter 2 -11 55
execute if score lift medium matches 425 run playsound sfx.moving_part.stop @a[tag=medium]
execute if score lift medium matches 430 run camerashake add @a[tag=medium] 0.3 0.5 positional 
execute if score lift medium matches 430 run structure load "lobby/elevators:MainElevatorFalls" -2 -12 51
execute if score lift medium matches 450 run structure load "lobby/elevators:MainElevatorFalls" -2 -11 51
execute if score lift medium matches 460 run playsound sfx.elevator.medium_platform @a[tag=medium]
execute if score lift medium matches 460 run structure load "lobby/elevators:MainElevator2" -2 -14 50
execute as @a[tag=medium] at @s if score lift medium matches 460 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 475 run structure load "lobby/elevators:MainElevator2" -2 -14 49
execute as @a[tag=medium] at @s if score lift medium matches 475 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 490 run structure load "lobby/elevators:MainElevator2" -2 -14 48
execute as @a[tag=medium] at @s if score lift medium matches 490 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 500 run structure load "lobby/elevators:MainElevator2" -2 -14 47
execute as @a[tag=medium] at @s if score lift medium matches 500 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 510 run structure load "lobby/elevators:MainElevator2" -2 -14 46
execute as @a[tag=medium] at @s if score lift medium matches 510 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 520 run structure load "lobby/elevators:MainElevator2" -2 -14 45
execute as @a[tag=medium] at @s if score lift medium matches 520 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 530 run structure load "lobby/elevators:MainElevator2" -2 -14 44
execute as @a[tag=medium] at @s if score lift medium matches 530 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 540 run structure load "lobby/elevators:MainElevator2" -2 -14 43
execute as @a[tag=medium] at @s if score lift medium matches 540 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 550 run structure load "lobby/elevators:MainElevator2" -2 -14 42
execute as @a[tag=medium] at @s if score lift medium matches 550 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 560 run structure load "lobby/elevators:MainElevator2" -2 -14 41
execute as @a[tag=medium] at @s if score lift medium matches 560 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 570 run structure load "lobby/elevators:MainElevator2" -2 -14 40
execute as @a[tag=medium] at @s if score lift medium matches 570 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 580 run structure load "lobby/elevators:MainElevator2" -2 -14 39
execute as @a[tag=medium] at @s if score lift medium matches 580 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 590 run structure load "lobby/elevators:MainElevator2" -2 -14 38
execute as @a[tag=medium] at @s if score lift medium matches 590 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 600 run structure load "lobby/elevators:MainElevator2" -2 -14 37
execute as @a[tag=medium] at @s if score lift medium matches 600 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 610 run structure load "lobby/elevators:MainElevator2" -2 -14 36
execute as @a[tag=medium] at @s if score lift medium matches 610 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 620 run structure load "lobby/elevators:MainElevator2" -2 -14 35
execute as @a[tag=medium] at @s if score lift medium matches 620 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 630 run structure load "lobby/elevators:MainElevator2" -2 -14 34
execute as @a[tag=medium] at @s if score lift medium matches 630 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 640 run structure load "lobby/elevators:MainElevator2" -2 -14 33
execute as @a[tag=medium] at @s if score lift medium matches 640 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 650 run structure load "lobby/elevators:MainElevator2" -2 -14 32
execute as @a[tag=medium] at @s if score lift medium matches 650 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 660 run structure load "lobby/elevators:MainElevator2" -2 -14 31
execute as @a[tag=medium] at @s if score lift medium matches 660 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 675 run structure load "lobby/elevators:MainElevator2" -2 -14 30
execute as @a[tag=medium] at @s if score lift medium matches 675 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 690 run structure load "lobby/elevators:MainElevator2" -2 -14 29
execute as @a[tag=medium] at @s if score lift medium matches 690 run function game_functions/mode_medium/player_tp
execute if score lift medium matches 660 run structure load "lobby/elevators:MainElevatorFalls1" -2 -11 29
execute if score lift medium matches 670 run structure load "lobby/elevators:MainElevatorFalls" -2 -11 29
execute if score lift medium matches 680 run structure load "lobby/elevators:MainElevatorFalls" -2 -12 29
execute if score lift medium matches 690 run structure load "lobby/elevators:MainElevator" -2 -15 29
execute if score lift medium matches 690 run particle minecraft:critical_hit_emitter -2 -11 33
execute if score lift medium matches 690 run particle minecraft:critical_hit_emitter -2 -11 29
execute if score lift medium matches 690 run particle minecraft:critical_hit_emitter 2 -11 33
execute if score lift medium matches 690 run particle minecraft:critical_hit_emitter 2 -11 29
execute if score lift medium matches 690 run playsound sfx.moving_part.stop @a[tag=medium]
execute if score lift medium matches 690 run stopsound @a[tag=medium] sfx.elevator.medium_platform
execute if score lift medium matches 690 run camerashake add @a[tag=medium] 0.3 0.5 positional 
# // - Resuming the descend into the separate elevator shaft -
execute if score lift medium matches 720 run playsound sfx.elevator.lift @a[tag=medium]
execute if score lift medium matches 720 run structure load "lobby/elevators:MainElevator" -2 -15 29
execute if score lift medium matches 740 run structure load "lobby/elevators:MainElevator" -2 -16 29
execute if score lift medium matches 755 run structure load "lobby/elevators:MainElevator" -2 -17 29
execute if score lift medium matches 765 run structure load "lobby/elevators:MainElevator" -2 -18 29
execute if score lift medium matches 770 run structure load "lobby/elevators:MainElevator" -2 -19 29
execute if score lift medium matches 775 run structure load "lobby/elevators:MainElevator" -2 -20 29
execute if score lift medium matches 780 run structure load "lobby/elevators:MainElevator" -2 -21 29
execute if score lift medium matches 785 run structure load "lobby/elevators:MainElevator" -2 -22 29
execute if score lift medium matches 790 run structure load "lobby/elevators:MainElevator" -2 -23 29
execute if score lift medium matches 795 run structure load "lobby/elevators:MainElevator" -2 -24 29
execute if score lift medium matches 800 run structure load "lobby/elevators:MainElevator" -2 -25 29
execute if score lift medium matches 805 run structure load "lobby/elevators:MainElevator" -2 -26 29
execute if score lift medium matches 810 run structure load "lobby/elevators:MainElevator" -2 -27 29
execute if score lift medium matches 815 run structure load "lobby/elevators:MainElevator" -2 -28 29
execute if score lift medium matches 820 run structure load "lobby/elevators:MainElevator" -2 -29 29
execute if score lift medium matches 825 run structure load "lobby/elevators:MainElevator" -2 -30 29
execute if score lift medium matches 830 run structure load "lobby/elevators:MainElevator" -2 -31 29
execute if score lift medium matches 835 run structure load "lobby/elevators:MainElevator" -2 -32 29
execute if score lift medium matches 840 run structure load "lobby/elevators:MainElevator" -2 -33 29
execute if score lift medium matches 845 run structure load "lobby/elevators:MainElevator" -2 -34 29
execute if score lift medium matches 850 run structure load "lobby/elevators:MainElevator" -2 -35 29
# // Entering Room 1
execute if score lift medium matches 850 run structure load "lobby:LiftBorderPrecaution" -3 -59 28
execute if score lift medium matches 855 run structure load "lobby/elevators:MainElevator" -2 -36 29
execute if score lift medium matches 860 run structure load "lobby/elevators:MainElevator" -2 -37 29
execute if score lift medium matches 865 run structure load "lobby/elevators:MainElevator" -2 -38 29
execute if score lift medium matches 870 run structure load "lobby/elevators:MainElevator" -2 -39 29
execute if score lift medium matches 875 run structure load "lobby/elevators:MainElevator" -2 -40 29
execute if score lift medium matches 880 run structure load "lobby/elevators:MainElevator" -2 -41 29
execute if score lift medium matches 885 run structure load "lobby/elevators:MainElevator" -2 -42 29
execute if score lift medium matches 895 run structure load "lobby/elevators:MainElevator" -2 -43 29
execute if score lift medium matches 905 run structure load "lobby/elevators:MainElevator" -2 -44 29
execute if score lift medium matches 920 run structure load "lobby/elevators:MainElevator" -2 -45 29
execute if score lift medium matches 920 run playsound sfx.elevator.stop @a[tag=medium]
execute if score lift medium matches 920 run stopsound @a[tag=medium] sfx.elevator.loop
# // Release players
execute if score lift medium matches 930 run playsound sfx.doors.liftsepparate @a 0 -49 31
execute if score lift medium matches 930 run structure load "lobby/elevators:MainElevatorOpen1" -2 -49 29
execute if score lift medium matches 932 run structure load "lobby/elevators:MainElevatorOpen2" -2 -49 29
execute if score lift medium matches 934 run structure load "lobby/elevators:MainElevatorOpen3" -2 -49 29
execute if score lift medium matches 938 run structure load "lobby/elevators:MainElevatorOpen2" -2 -49 29
execute if score lift medium matches 940 run structure load "lobby/elevators:MainElevatorOpen3" -2 -49 29
# // begin game
execute if score lift medium matches 940 run scoreboard players set started medium 1
# // Raise elevator back to the surface
execute if score lift medium matches 950 run structure load "lobby/elevators:MainElevatorOpen3" -2 -48 29
execute if score lift medium matches 960 run structure load "lobby/elevators:MainElevatorOpen3" -2 -47 29
execute if score lift medium matches 965 run structure load "lobby:LiftBorderRemove" -3 -59 28
execute if score lift medium matches 970 run structure load "lobby/elevators:MainElevatorOpen3" -2 -46 29
execute if score lift medium matches 978 run structure load "lobby/elevators:MainElevatorOpen3" -2 -45 29
execute if score lift medium matches 985 run structure load "lobby/elevators:MainElevatorOpen3" -2 -44 29
execute if score lift medium matches 992 run structure load "lobby/elevators:MainElevatorOpen3" -2 -43 29
execute if score lift medium matches 1000 run structure load "lobby/elevators:MainElevatorOpen3" -2 -42 29
execute if score lift medium matches 1005 run structure load "lobby/elevators:MainElevatorOpen3" -2 -41 29
execute if score lift medium matches 1010 run structure load "lobby/elevators:MainElevatorOpen3" -2 -40 29
execute if score lift medium matches 1015 run structure load "lobby/elevators:MainElevatorOpen3" -2 -39 29
execute if score lift medium matches 1020 run structure load "lobby/elevators:MainElevatorOpen3" -2 -38 29
execute if score lift medium matches 1025 run structure load "lobby/elevators:MainElevatorOpen3" -2 -37 29
execute if score lift medium matches 1030 run structure load "lobby/elevators:MainElevatorOpen3" -2 -36 29
execute if score lift medium matches 1035 run structure load "lobby/elevators:MainElevatorOpen3" -2 -35 29
# // Exiting Room 1
execute if score lift medium matches 1040 run structure load "lobby/elevators:MainElevatorOpen3" -2 -35 29
execute if score lift medium matches 1044 run structure load "lobby/elevators:MainElevatorOpen3" -2 -34 29
execute if score lift medium matches 1048 run structure load "lobby/elevators:MainElevatorOpen3" -2 -33 29
execute if score lift medium matches 1052 run structure load "lobby/elevators:MainElevatorOpen3" -2 -32 29
execute if score lift medium matches 1055 run structure load "lobby/elevators:MainElevatorOpen3" -2 -31 29
execute if score lift medium matches 1058 run structure load "lobby/elevators:MainElevatorOpen3" -2 -30 29
execute if score lift medium matches 1061 run structure load "lobby/elevators:MainElevatorOpen3" -2 -29 29
execute if score lift medium matches 1064 run structure load "lobby/elevators:MainElevatorOpen3" -2 -28 29
execute if score lift medium matches 1067 run structure load "lobby/elevators:MainElevatorOpen3" -2 -27 29
execute if score lift medium matches 1070 run structure load "lobby/elevators:MainElevatorOpen3" -2 -26 29
execute if score lift medium matches 1073 run structure load "lobby/elevators:MainElevatorOpen3" -2 -25 29
execute if score lift medium matches 1076 run structure load "lobby/elevators:MainElevatorOpen3" -2 -24 29
execute if score lift medium matches 1080 run structure load "lobby/elevators:MainElevatorOpen3" -2 -23 29
execute if score lift medium matches 1085 run structure load "lobby/elevators:MainElevatorOpen3" -2 -22 29
execute if score lift medium matches 1090 run structure load "lobby/elevators:MainElevatorOpen3" -2 -21 29
execute if score lift medium matches 1100 run structure load "lobby/elevators:MainElevatorOpen3" -2 -20 29
execute if score lift medium matches 1120 run structure load "lobby/elevators:MainElevatorOpen3" -2 -19 29
# // Close the Elevator
execute if score lift medium matches 1120 run structure load "lobby/elevators:MainElevatorOpen2" -2 -19 29
execute if score lift medium matches 1130 run structure load "lobby/elevators:MainElevatorOpen1" -2 -19 29
execute if score lift medium matches 1140 run structure load "lobby/elevators:MainElevator" -2 -15 29
# // - de-attaching from the secondary falls -
execute if score lift medium matches 1140 run particle minecraft:critical_hit_emitter -2 -11 33
execute if score lift medium matches 1140 run particle minecraft:critical_hit_emitter -2 -11 29
execute if score lift medium matches 1140 run particle minecraft:critical_hit_emitter 2 -11 33
execute if score lift medium matches 1140 run particle minecraft:critical_hit_emitter 2 -11 29
execute if score lift medium matches 1140 run structure load "lobby/elevators:MainElevatorFalls" -2 -12 29
execute if score lift medium matches 1150 run structure load "lobby/elevators:MainElevatorFalls" -2 -11 29
execute if score lift medium matches 1160 run structure load "lobby/elevators:MainElevatorFalls1" -2 -11 29
execute if score lift medium matches 1140 run structure load "lobby/elevators:MainElevator3" -2 -14 29
execute if score lift medium matches 1150 run structure load "lobby/elevators:MainElevator3" -2 -14 30
execute if score lift medium matches 1160 run structure load "lobby/elevators:MainElevator3" -2 -14 31
execute if score lift medium matches 1170 run structure load "lobby/elevators:MainElevator3" -2 -14 32
execute if score lift medium matches 1180 run structure load "lobby/elevators:MainElevator3" -2 -14 33
execute if score lift medium matches 1190 run structure load "lobby/elevators:MainElevator3" -2 -14 34
execute if score lift medium matches 1200 run structure load "lobby/elevators:MainElevator3" -2 -14 35
execute if score lift medium matches 1210 run structure load "lobby/elevators:MainElevator3" -2 -14 36
execute if score lift medium matches 1220 run structure load "lobby/elevators:MainElevator3" -2 -14 37
execute if score lift medium matches 1230 run structure load "lobby/elevators:MainElevator3" -2 -14 38
execute if score lift medium matches 1240 run structure load "lobby/elevators:MainElevator3" -2 -14 39
execute if score lift medium matches 1250 run structure load "lobby/elevators:MainElevator3" -2 -14 40
execute if score lift medium matches 1260 run structure load "lobby/elevators:MainElevator3" -2 -14 41
execute if score lift medium matches 1270 run structure load "lobby/elevators:MainElevator3" -2 -14 42
execute if score lift medium matches 1280 run structure load "lobby/elevators:MainElevator3" -2 -14 43
execute if score lift medium matches 1290 run structure load "lobby/elevators:MainElevator3" -2 -14 44
execute if score lift medium matches 1300 run structure load "lobby/elevators:MainElevator3" -2 -14 45
execute if score lift medium matches 1310 run structure load "lobby/elevators:MainElevator3" -2 -14 46
execute if score lift medium matches 1320 run structure load "lobby/elevators:MainElevator3" -2 -14 47
execute if score lift medium matches 1330 run structure load "lobby/elevators:MainElevator3" -2 -14 48
execute if score lift medium matches 1340 run structure load "lobby/elevators:MainElevator3" -2 -14 49
execute if score lift medium matches 1350 run structure load "lobby/elevators:MainElevator3" -2 -14 50
execute if score lift medium matches 1360 run structure load "lobby/elevators:MainElevatorFalls" -2 -11 51
execute if score lift medium matches 1370 run structure load "lobby/elevators:MainElevatorFalls" -2 -12 51
execute if score lift medium matches 1380 run structure load "lobby/elevators:MainElevator" -2 -15 51
execute if score lift medium matches 1380 run particle minecraft:critical_hit_emitter -2 -11 51
execute if score lift medium matches 1380 run particle minecraft:critical_hit_emitter -2 -11 55
execute if score lift medium matches 1380 run particle minecraft:critical_hit_emitter 2 -11 51
execute if score lift medium matches 1380 run particle minecraft:critical_hit_emitter 2 -11 55
# // - Resume Ascend onto the main shaft -
execute if score lift medium matches 1390 run structure load "lobby/elevators:MainElevator" -2 -14 51
execute if score lift medium matches 1400 run structure load "lobby/elevators:MainElevator" -2 -13 51
execute if score lift medium matches 1405 run structure load "lobby/elevators:MainElevator" -2 -12 51
execute if score lift medium matches 1410 run structure load "lobby/elevators:MainElevator" -2 -11 51
execute if score lift medium matches 1414 run structure load "lobby/elevators:MainElevator" -2 -10 51
execute if score lift medium matches 1418 run structure load "lobby/elevators:MainElevator" -2 -9 51
execute if score lift medium matches 1422 run structure load "lobby/elevators:MainElevator" -2 -8 51
execute if score lift medium matches 1426 run structure load "lobby/elevators:MainElevator" -2 -7 51
execute if score lift medium matches 1430 run structure load "lobby/elevators:MainElevator" -2 -6 51
execute if score lift medium matches 1433 run structure load "lobby/elevators:MainElevator" -2 -5 51
execute if score lift medium matches 1436 run structure load "lobby/elevators:MainElevator" -2 -4 51
execute if score lift medium matches 1439 run structure load "lobby/elevators:MainElevator" -2 -3 51
execute if score lift medium matches 1442 run structure load "lobby/elevators:MainElevator" -2 -2 51
execute if score lift medium matches 1445 run structure load "lobby/elevators:MainElevator" -2 -1 51
execute if score lift medium matches 1448 run structure load "lobby/elevators:MainElevator" -2 0 51
execute if score lift medium matches 1451 run structure load "lobby/elevators:MainElevator" -2 1 51
execute if score lift medium matches 1454 run structure load "lobby/elevators:MainElevator" -2 2 51
execute if score lift medium matches 1457 run structure load "lobby/elevators:MainElevator" -2 3 51
execute if score lift medium matches 1460 run structure load "lobby/elevators:MainElevator" -2 4 51
execute if score lift medium matches 1462 run structure load "lobby/elevators:MainElevator" -2 5 51
execute if score lift medium matches 1464 run structure load "lobby/elevators:MainElevator" -2 6 51
execute if score lift medium matches 1466 run structure load "lobby/elevators:MainElevator" -2 7 51
execute if score lift medium matches 1468 run structure load "lobby/elevators:MainElevator" -2 8 51
execute if score lift medium matches 1470 run structure load "lobby/elevators:MainElevator" -2 9 51
execute if score lift medium matches 1471 run structure load "lobby/elevators:MainElevator" -2 10 51
execute if score lift medium matches 1472 run structure load "lobby/elevators:MainElevator" -2 11 51
execute if score lift medium matches 1473 run structure load "lobby/elevators:MainElevator" -2 12 51
execute if score lift medium matches 1474 run structure load "lobby/elevators:MainElevator" -2 13 51
execute if score lift medium matches 1475 run structure load "lobby/elevators:MainElevator" -2 14 51
execute if score lift medium matches 1476 run structure load "lobby/elevators:MainElevator" -2 15 51
execute if score lift medium matches 1477 run structure load "lobby/elevators:MainElevator" -2 16 51
execute if score lift medium matches 1478 run structure load "lobby/elevators:MainElevator" -2 17 51
execute if score lift medium matches 1479 run structure load "lobby/elevators:MainElevator" -2 18 51
execute if score lift medium matches 1480 run structure load "lobby/elevators:MainElevator" -2 19 51
execute if score lift medium matches 1481 run structure load "lobby/elevators:MainElevator" -2 20 51
# // Exiting Gamemode Shaft
execute if score lift medium matches 1482 run structure load "lobby/elevators:MainElevator" -2 21 51
execute if score lift medium matches 1483 run structure load "lobby/elevators:MainElevator" -2 22 51
execute if score lift medium matches 1484 run structure load "lobby/elevators:MainElevator" -2 23 51
execute if score lift medium matches 1485 run structure load "lobby/elevators:MainElevator" -2 24 51
execute if score lift medium matches 1486 run structure load "lobby/elevators:MainElevator" -2 25 51
execute if score lift medium matches 1487 run structure load "lobby/elevators:MainElevator" -2 26 51
execute if score lift medium matches 1488 run structure load "lobby/elevators:MainElevator" -2 27 51
execute if score lift medium matches 1489 run structure load "lobby/elevators:MainElevator" -2 28 51
execute if score lift medium matches 1490 run structure load "lobby/elevators:MainElevator" -2 29 51
execute if score lift medium matches 1491 run structure load "lobby/elevators:MainElevator" -2 30 51
execute if score lift medium matches 1492 run structure load "lobby/elevators:MainElevator" -2 31 51
execute if score lift medium matches 1493 run structure load "lobby/elevators:MainElevator" -2 32 51
execute if score lift medium matches 1494 run structure load "lobby/elevators:MainElevator" -2 33 51
execute if score lift medium matches 1495 run structure load "lobby/elevators:MainElevator" -2 34 51
execute if score lift medium matches 1496 run structure load "lobby/elevators:MainElevator" -2 35 51
execute if score lift medium matches 1497 run structure load "lobby/elevators:MainElevator" -2 36 51
execute if score lift medium matches 1498 run structure load "lobby/elevators:MainElevator" -2 37 51
execute if score lift medium matches 1499 run structure load "lobby/elevators:MainElevator" -2 38 51
execute if score lift medium matches 1500 run structure load "lobby/elevators:MainElevator" -2 39 51
execute if score lift medium matches 1501 run structure load "lobby/elevators:MainElevator" -2 40 51
execute if score lift medium matches 1502 run structure load "lobby/elevators:MainElevator" -2 41 51
execute if score lift medium matches 1503 run structure load "lobby/elevators:MainElevator" -2 42 51
execute if score lift medium matches 1504 run structure load "lobby/elevators:MainElevator" -2 43 51
execute if score lift medium matches 1505 run structure load "lobby/elevators:MainElevator" -2 44 51
execute if score lift medium matches 1506 run structure load "lobby/elevators:MainElevator" -2 45 51
execute if score lift medium matches 1507 run structure load "lobby/elevators:MainElevator" -2 46 51
execute if score lift medium matches 1508 run structure load "lobby/elevators:MainElevator" -2 47 51
execute if score lift medium matches 1509 run structure load "lobby/elevators:MainElevator" -2 48 51
execute if score lift medium matches 1510 run structure load "lobby/elevators:MainElevator" -2 49 51
execute if score lift medium matches 1512 run structure load "lobby/elevators:MainElevator" -2 50 51
execute if score lift medium matches 1514 run structure load "lobby/elevators:MainElevator" -2 51 51
execute if score lift medium matches 1516 run structure load "lobby/elevators:MainElevator" -2 52 51
execute if score lift medium matches 1518 run structure load "lobby/elevators:MainElevator" -2 53 51
execute if score lift medium matches 1520 run structure load "lobby/elevators:MainElevator" -2 54 51
execute if score lift medium matches 1523 run structure load "lobby/elevators:MainElevator" -2 55 51
execute if score lift medium matches 1526 run structure load "lobby/elevators:MainElevator" -2 56 51
execute if score lift medium matches 1529 run structure load "lobby/elevators:MainElevator" -2 57 51
execute if score lift medium matches 1532 run structure load "lobby/elevators:MainElevator" -2 58 51
execute if score lift medium matches 1536 run structure load "lobby/elevators:MainElevator" -2 59 51
execute if score lift medium matches 1540 run structure load "lobby/elevators:MainElevator" -2 60 51
execute if score lift medium matches 1544 run structure load "lobby/elevators:MainElevator" -2 61 51
execute if score lift medium matches 1548 run structure load "lobby/elevators:MainElevator" -2 62 51
execute if score lift medium matches 1552 run structure load "lobby/elevators:MainElevator" -2 63 51
execute if score lift medium matches 1556 run structure load "lobby/elevators:MainElevator" -2 64 51
execute if score lift medium matches 1560 run structure load "lobby/elevators:MainElevator" -2 65 51
execute if score lift medium matches 1564 run structure load "lobby/elevators:MainElevator" -2 66 51
execute if score lift medium matches 1568 run structure load "lobby/elevators:MainElevator" -2 67 51
execute if score lift medium matches 1572 run structure load "lobby/elevators:MainElevator" -2 68 51
execute if score lift medium matches 1576 run structure load "lobby/elevators:MainElevator" -2 69 51
execute if score lift medium matches 1584 run structure load "lobby/elevators:MainElevator" -2 70 51
execute if score lift medium matches 1588 run structure load "lobby/elevators:MainElevator" -2 71 51
execute if score lift medium matches 1592 run structure load "lobby/elevators:MainElevator" -2 72 51
execute if score lift medium matches 1596 run structure load "lobby/elevators:MainElevator" -2 73 51
execute if score lift medium matches 1600 run structure load "lobby/elevators:MainElevator" -2 74 51
execute if score lift medium matches 1605 run structure load "lobby/elevators:MainElevator" -2 75 51
execute if score lift medium matches 1610 run structure load "lobby/elevators:MainElevator" -2 76 51
execute if score lift medium matches 1615 run structure load "lobby/elevators:MainElevator" -2 77 51
execute if score lift medium matches 1620 run structure load "lobby/elevators:MainElevator" -2 78 51
execute if score lift medium matches 1625 run structure load "lobby/elevators:MainElevator" -2 79 51
execute if score lift medium matches 1630 run structure load "lobby/elevators:MainElevator" -2 80 51
execute if score lift medium matches 1635 run structure load "lobby/elevators:MainElevator" -2 81 51
execute if score lift medium matches 1640 run structure load "lobby/elevators:MainElevator" -2 82 51
execute if score lift medium matches 1645 run structure load "lobby/elevators:MainElevator" -2 83 51
execute if score lift medium matches 1650 run structure load "lobby/elevators:MainElevator" -2 84 51
execute if score lift medium matches 1660 run structure load "lobby/elevators:MainElevator" -2 85 51
execute if score lift medium matches 1670 run structure load "lobby/elevators:MainElevator" -2 86 51
execute if score lift medium matches 1680 run structure load "lobby/elevators:MainElevator" -2 87 51
# = OTHER THINGS =
# // Silo door open
execute if score lift medium matches 720 run structure load "lobby/doors:SiloDoor2" -2 -36 26
execute if score lift medium matches 770 run structure load "lobby/doors:SiloDoor3" -2 -36 26
execute if score lift medium matches 840 run structure load "lobby/doors:SiloDoor4" -2 -36 26
# // Silo door close
execute if score lift medium matches 1044 run structure load "lobby/doors:SiloDoor3" -2 -36 26
execute if score lift medium matches 1074 run structure load "lobby/doors:SiloDoor2" -2 -36 26
execute if score lift medium matches 1104 run structure load "lobby/doors:SiloDoor1" -2 -36 26
# = ALARM EFFECT =
# // Elevator deck alarms
execute if score alarm medium matches 1 run structure load "medium:MediumStateLower1" -3 93 50
execute if score alarm medium matches 4 run structure load "medium:MediumStateLower2" -3 93 50
execute if score alarm medium matches 7 run structure load "medium:MediumStateLower3" -3 93 50
execute if score alarm medium matches 10 run structure load "medium:MediumStateLower4" -3 93 50
# // Sub-Engine Room Elevator Shaft Alarms
execute if score alarm medium matches 1 run structure load "lobby/animated:MediumElevatorShaftAlarm1" -2 -11 36
execute if score alarm medium matches 4 run structure load "lobby/animated:MediumElevatorShaftAlarm2" -2 -11 36
execute if score alarm medium matches 7 run structure load "lobby/animated:MediumElevatorShaftAlarm3" -2 -11 36
execute if score alarm medium matches 10 run structure load "lobby/animated:MediumElevatorShaftAlarm4" -2 -11 36
execute if score alarm medium matches 12.. run scoreboard players set alarm medium 0
# // change elevator status
execute if score lift medium matches 1700 run scoreboard players set start medium 2
execute if score lift medium matches 1700 run structure load "medium:MediumStateBusy" -3 93 50
execute if score lift medium matches 1700 run structure load "lobby/animated:MediumElevatorShaftAlarmOff" -2 -11 36
execute if score lift medium matches 1700 if score p_game medium matches 0 run scoreboard players set reset medium 1
execute if score lift medium matches 1700 run scoreboard players set lift medium 0
# = RESET =
execute if score reset medium matches 1 if score p_game medium matches 0 if score lift medium matches -40 if score start medium matches 2 run function game_functions/mode_medium/reset