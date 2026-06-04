# = SCORES =
execute if score start hard matches 1 run scoreboard players add lift hard 1
execute if score start hard matches 1 unless score lift hard matches 320..550 run scoreboard players add alarm hard 1
execute if score reset hard matches 1 run scoreboard players remove lift hard 1
# = CORE EVENTS IN ORDER =
# // - sound effects -
execute if score lift hard matches 1 run playsound sfx.alarm.hard @a -8 91 52
execute if score lift hard matches 1 run gamemode a @a[tag=hardlift]
# // silo door open
execute if score lift hard matches 607 run playsound silo_door.open @a -8 -34 52
execute if score lift hard matches 664 run stopsound @a silo_door.open
execute if score lift hard matches 704 run playsound silo_door.opened @a -8 -35 52
# // silo door close
execute if score lift hard matches 944 run playsound silo_door.open @a -8 -34 52
execute if score lift hard matches 1004 run stopsound @a silo_door.open
execute if score lift hard matches 1004 run playsound silo_door.opened @a -8 -35 52
# // - lift door -
# // shut the main door (as if it matters lol, they can jump over it)
execute if score lift hard matches 1 run structure load "hard:HardLiftDoor2" -10 89 49
execute if score lift hard matches 15 run structure load "hard:HardLiftDoor1" -10 89 49
# // open the door after the lift has risen again
execute if score lift hard matches 1240 run structure load "hard:HardLiftDoor2" -10 89 49
execute if score lift hard matches 1255 run structure load "hard:HardLiftDoor3" -10 89 49
# // lower the elevator
execute if score lift hard matches 25 positioned -8 89 52 run playsound sfx.elevator.lift @a[r=20] ~ ~ ~
execute if score lift hard matches 25 run playsound sfx.elevator.move @a[tag=hardlift]
execute if score lift hard matches 25 run structure load "lobby/elevators:MainElevator" -10 86 50
execute if score lift hard matches 45 run structure load "lobby/elevators:MainElevator" -10 85 50
execute if score lift hard matches 55 run structure load "lobby/elevators:MainElevator" -10 84 50
execute if score lift hard matches 65 run structure load "lobby/elevators:MainElevator" -10 83 50
execute if score lift hard matches 75 run structure load "lobby/elevators:MainElevator" -10 82 50
execute if score lift hard matches 84 run structure load "lobby/elevators:MainElevator" -10 81 50
execute if score lift hard matches 92 run structure load "lobby/elevators:MainElevator" -10 80 50
execute if score lift hard matches 100 run structure load "lobby/elevators:MainElevator" -10 79 50
execute if score lift hard matches 105 run structure load "lobby/elevators:MainElevator" -10 78 50
execute if score lift hard matches 110 run structure load "lobby/elevators:MainElevator" -10 77 50
execute if score lift hard matches 115 run structure load "lobby/elevators:MainElevator" -10 76 50
execute if score lift hard matches 120 run structure load "lobby/elevators:MainElevator" -10 75 50
execute if score lift hard matches 124 run structure load "lobby/elevators:MainElevator" -10 74 50
execute if score lift hard matches 128 run structure load "lobby/elevators:MainElevator" -10 73 50
execute if score lift hard matches 132 run structure load "lobby/elevators:MainElevator" -10 72 50
execute if score lift hard matches 136 run structure load "lobby/elevators:MainElevator" -10 71 50
execute if score lift hard matches 140 run structure load "lobby/elevators:MainElevator" -10 70 50
execute if score lift hard matches 144 run structure load "lobby/elevators:MainElevator" -10 69 50
execute if score lift hard matches 148 run structure load "lobby/elevators:MainElevator" -10 68 50
execute if score lift hard matches 152 run structure load "lobby/elevators:MainElevator" -10 67 50
execute if score lift hard matches 156 run structure load "lobby/elevators:MainElevator" -10 66 50
execute if score lift hard matches 160 run structure load "lobby/elevators:MainElevator" -10 65 50
execute if score lift hard matches 163 run structure load "lobby/elevators:MainElevator" -10 64 50
execute if score lift hard matches 166 run structure load "lobby/elevators:MainElevator" -10 63 50
execute if score lift hard matches 169 run structure load "lobby/elevators:MainElevator" -10 62 50
execute if score lift hard matches 172 run structure load "lobby/elevators:MainElevator" -10 61 50
execute if score lift hard matches 175 run structure load "lobby/elevators:MainElevator" -10 60 50
execute if score lift hard matches 178 run structure load "lobby/elevators:MainElevator" -10 59 50
execute if score lift hard matches 181 run structure load "lobby/elevators:MainElevator" -10 58 50
execute if score lift hard matches 184 run structure load "lobby/elevators:MainElevator" -10 57 50
execute if score lift hard matches 187 run structure load "lobby/elevators:MainElevator" -10 56 50
execute if score lift hard matches 190 run structure load "lobby/elevators:MainElevator" -10 55 50
execute if score lift hard matches 193 run structure load "lobby/elevators:MainElevator" -10 54 50
execute if score lift hard matches 196 run structure load "lobby/elevators:MainElevator" -10 53 50
execute if score lift hard matches 199 run structure load "lobby/elevators:MainElevator" -10 52 50
execute if score lift hard matches 201 run structure load "lobby/elevators:MainElevator" -10 51 50
execute if score lift hard matches 203 run structure load "lobby/elevators:MainElevator" -10 50 50
execute if score lift hard matches 205 run structure load "lobby/elevators:MainElevator" -10 49 50
execute if score lift hard matches 207 run structure load "lobby/elevators:MainElevator" -10 48 50
execute if score lift hard matches 209 run structure load "lobby/elevators:MainElevator" -10 47 50
execute if score lift hard matches 211 run structure load "lobby/elevators:MainElevator" -10 46 50
execute if score lift hard matches 213 run structure load "lobby/elevators:MainElevator" -10 45 50
execute if score lift hard matches 215 run structure load "lobby/elevators:MainElevator" -10 44 50
execute if score lift hard matches 217 run structure load "lobby/elevators:MainElevator" -10 43 50
execute if score lift hard matches 219 run structure load "lobby/elevators:MainElevator" -10 42 50
execute if score lift hard matches 221 run structure load "lobby/elevators:MainElevator" -10 41 50
execute if score lift hard matches 223 run structure load "lobby/elevators:MainElevator" -10 40 50
execute if score lift hard matches 225 run structure load "lobby/elevators:MainElevator" -10 39 50
execute if score lift hard matches 227 run structure load "lobby/elevators:MainElevator" -10 38 50
execute if score lift hard matches 229 run structure load "lobby/elevators:MainElevator" -10 37 50
execute if score lift hard matches 231 run structure load "lobby/elevators:MainElevator" -10 36 50
execute if score lift hard matches 233 run structure load "lobby/elevators:MainElevator" -10 35 50
execute if score lift hard matches 235 run structure load "lobby/elevators:MainElevator" -10 34 50
execute if score lift hard matches 237 run structure load "lobby/elevators:MainElevator" -10 33 50
execute if score lift hard matches 237 run scoreboard players random metal lobby 1 7
execute if score lift hard matches 239 run structure load "lobby/elevators:MainElevator" -10 32 50
execute if score lift hard matches 241 run structure load "lobby/elevators:MainElevator" -10 31 50
execute if score lift hard matches 243 run structure load "lobby/elevators:MainElevator" -10 30 50
execute if score lift hard matches 245 run structure load "lobby/elevators:MainElevator" -10 29 50
execute if score lift hard matches 247 run structure load "lobby/elevators:MainElevator" -10 28 50
execute if score lift hard matches 249 run structure load "lobby/elevators:MainElevator" -10 27 50
execute if score lift hard matches 251 run structure load "lobby/elevators:MainElevator" -10 26 50
execute if score lift hard matches 253 run structure load "lobby/elevators:MainElevator" -10 25 50
execute if score lift hard matches 255 run structure load "lobby/elevators:MainElevator" -10 24 50
execute if score lift hard matches 257 run structure load "lobby/elevators:MainElevator" -10 23 50
execute if score lift hard matches 259 run structure load "lobby/elevators:MainElevator" -10 22 50
execute if score lift hard matches 261 run structure load "lobby/elevators:MainElevator" -10 21 50
# // - entering the gamemode shaft
execute if score lift hard matches 263 run playsound sfx.ambiance.gamemode_shaft @a[tag=hard]
execute if score lift hard matches 263 run function game_functions/mode_hard/decider
execute if score lift hard matches 263 run structure load "lobby/elevators:MainElevator" -10 20 50
execute if score lift hard matches 265 run structure load "lobby/elevators:MainElevator" -10 19 50
execute if score lift hard matches 267 run structure load "lobby/elevators:MainElevator" -10 18 50
execute if score lift hard matches 269 run structure load "lobby/elevators:MainElevator" -10 17 50
execute if score lift hard matches 272 run structure load "lobby/elevators:MainElevator" -10 16 50
execute if score lift hard matches 272 run scoreboard players random explosion lobby 1 6
execute if score lift hard matches 275 run structure load "lobby/elevators:MainElevator" -10 15 50
execute if score lift hard matches 278 run structure load "lobby/elevators:MainElevator" -10 14 50
execute if score lift hard matches 281 run structure load "lobby/elevators:MainElevator" -10 13 50
execute if score lift hard matches 284 run structure load "lobby/elevators:MainElevator" -10 12 50
execute if score lift hard matches 287 run structure load "lobby/elevators:MainElevator" -10 11 50
execute if score lift hard matches 290 run structure load "lobby/elevators:MainElevator" -10 10 50
execute if score lift hard matches 293 run structure load "lobby/elevators:MainElevator" -10 9 50
execute if score lift hard matches 296 run structure load "lobby/elevators:MainElevator" -10 8 50
execute if score lift hard matches 299 run structure load "lobby/elevators:MainElevator" -10 7 50
execute if score lift hard matches 302 run structure load "lobby/elevators:MainElevator" -10 6 50
execute if score lift hard matches 305 run structure load "lobby/elevators:MainElevator" -10 5 50
execute if score lift hard matches 308 run structure load "lobby/elevators:MainElevator" -10 4 50
execute if score lift hard matches 311 run structure load "lobby/elevators:MainElevator" -10 3 50
execute if score lift hard matches 311 run scoreboard players random metal lobby 1 7
execute if score lift hard matches 314 run structure load "lobby/elevators:MainElevator" -10 2 50
execute if score lift hard matches 317 run structure load "lobby/elevators:MainElevator" -10 1 50
execute if score lift hard matches 320 run structure load "lobby/elevators:MainElevator" -10 0 50
# // = Short circuit =
execute if score lift hard matches 320 run structure load "hard:HardModeLightsOff" -11 -32 49 0_degrees none block_by_block 1
execute if score lift hard matches 320 run structure load "hard:HardStateBusy" -11 93 49 0_degrees none block_by_block 1
execute if score lift hard matches 320 run stopsound @a[tag=hard] sfx.elevator.move
execute if score lift hard matches 320 run playsound sfx.elevator.hardstop @a[tag=hard]
execute if score lift hard matches 320 run playsound sfx.powerdown @a[tag=hard]
execute if score lift hard matches 320 run camerashake add @a[tag=hard] 2 0.5 positional
execute if score lift hard matches 320..330 run particle minecraft:critical_hit_emitter -6 3 50
execute if score lift hard matches 320..330 run particle minecraft:critical_hit_emitter -6 3 54
execute if score lift hard matches 320..330 run particle minecraft:critical_hit_emitter -10 3 50
execute if score lift hard matches 320..330 run particle minecraft:critical_hit_emitter -10 3 54
execute if score lift hard matches 350 run playsound sfx.pipe.connect @a[tag=hard]
execute if score lift hard matches 352 run structure load "hard:HardModeLightsOn" -11 -32 49
execute if score lift hard matches 360 run structure load "hard:HardModeLightsOff" -11 -32 49
execute if score lift hard matches 350..360 run particle brr:pipe_burst01 -9 6 48
execute if score lift hard matches 390 run camerashake add @a[tag=hard] 1 0.4 positional
execute if score lift hard matches 390 run structure load "lobby/elevators:MainElevator" -10 -1 50
execute if score lift hard matches 500 run structure load "hard:HardModeLightsOn" -11 -32 49 0_degrees none block_by_block 5
# // = Slowly resume =
execute if score lift hard matches 500 run playsound sfx.elevator.ring @a[tag=hard]
execute if score lift hard matches 520 run playsound sfx.elevator.lift @a[tag=hard] ~ ~ ~
execute if score lift hard matches 520 run playsound sfx.elevator.move @a[tag=hard]
execute if score lift hard matches 520 run structure load "lobby/elevators:MainElevator" -10 -2 50
execute if score lift hard matches 540 run structure load "lobby/elevators:MainElevator" -10 -3 50
execute if score lift hard matches 550 run structure load "lobby/elevators:MainElevator" -10 -4 50
execute if score lift hard matches 560 run structure load "lobby/elevators:MainElevator" -10 -5 50
execute if score lift hard matches 560 run scoreboard players random explosion lobby 1 6
execute if score lift hard matches 570 run structure load "lobby/elevators:MainElevator" -10 -6 50
execute if score lift hard matches 580 run structure load "lobby/elevators:MainElevator" -10 -7 50
execute if score lift hard matches 590 run structure load "lobby/elevators:MainElevator" -10 -8 50
execute if score lift hard matches 600 run structure load "lobby/elevators:MainElevator" -10 -9 50
execute if score lift hard matches 607 run structure load "lobby/elevators:MainElevator" -10 -10 50
execute if score lift hard matches 614 run structure load "lobby/elevators:MainElevator" -10 -11 50
execute if score lift hard matches 621 run structure load "lobby/elevators:MainElevator" -10 -12 50
execute if score lift hard matches 628 run structure load "lobby/elevators:MainElevator" -10 -13 50
execute if score lift hard matches 635 run structure load "lobby/elevators:MainElevator" -10 -14 50
execute if score lift hard matches 640 run structure load "lobby/elevators:MainElevator" -10 -15 50
execute if score lift hard matches 645 run structure load "lobby/elevators:MainElevator" -10 -16 50
execute if score lift hard matches 650 run structure load "lobby/elevators:MainElevator" -10 -17 50
execute if score lift hard matches 655 run structure load "lobby/elevators:MainElevator" -10 -18 50
execute if score lift hard matches 660 run structure load "lobby/elevators:MainElevator" -10 -19 50
execute if score lift hard matches 664 run structure load "lobby/elevators:MainElevator" -10 -20 50
execute if score lift hard matches 668 run structure load "lobby/elevators:MainElevator" -10 -21 50
execute if score lift hard matches 672 run structure load "lobby/elevators:MainElevator" -10 -22 50
execute if score lift hard matches 676 run structure load "lobby/elevators:MainElevator" -10 -23 50
execute if score lift hard matches 680 run structure load "lobby/elevators:MainElevator" -10 -24 50
execute if score lift hard matches 684 run structure load "lobby/elevators:MainElevator" -10 -25 50
execute if score lift hard matches 688 run structure load "lobby/elevators:MainElevator" -10 -26 50
execute if score lift hard matches 692 run structure load "lobby/elevators:MainElevator" -10 -27 50
execute if score lift hard matches 696 run structure load "lobby/elevators:MainElevator" -10 -28 50
execute if score lift hard matches 700 run structure load "lobby/elevators:MainElevator" -10 -29 50
execute if score lift hard matches 704 run structure load "lobby/elevators:MainElevator" -10 -30 50
execute if score lift hard matches 708 run structure load "lobby/elevators:MainElevator" -10 -31 50
execute if score lift hard matches 712 run structure load "lobby/elevators:MainElevator" -10 -32 50
execute if score lift hard matches 716 run structure load "lobby/elevators:MainElevator" -10 -33 50
execute if score lift hard matches 720 run structure load "lobby/elevators:MainElevator" -10 -34 50
execute if score lift hard matches 725 run structure load "lobby/elevators:MainElevator" -10 -35 50
# // Entering Room 1
execute if score lift hard matches 263 run structure load "lobby:LiftBorderPrecaution" 5 -59 49
execute if score lift hard matches 735 run structure load "lobby/elevators:MainElevator" -10 -36 50
execute if score lift hard matches 740 run structure load "lobby/elevators:MainElevator" -10 -37 50
execute if score lift hard matches 745 run structure load "lobby/elevators:MainElevator" -10 -38 50
execute if score lift hard matches 750 run structure load "lobby/elevators:MainElevator" -10 -39 50
execute if score lift hard matches 755 run structure load "lobby/elevators:MainElevator" -10 -40 50
execute if score lift hard matches 760 run structure load "lobby/elevators:MainElevator" -10 -41 50
execute if score lift hard matches 775 run structure load "lobby/elevators:MainElevator" -10 -42 50
execute if score lift hard matches 795 run structure load "lobby/elevators:MainElevator" -10 -43 50
execute if score lift hard matches 805 run structure load "lobby/elevators:MainElevator" -10 -44 50
execute if score lift hard matches 820 run structure load "lobby/elevators:MainElevator" -10 -45 50
execute if score lift hard matches 820 run playsound sfx.elevator.stop @a[tag=hard]
execute if score lift hard matches 820 run stopsound @a[tag=hard] sfx.elevator.move
execute if score lift hard matches 820 run stopsound @a[tag=hard] sfx.ambiance.gamemode_shaft
# // Release players
execute if score lift hard matches 830 run playsound sfx.doors.liftsepparate @a 8 -49 52
execute if score lift hard matches 830 run structure load "lobby/elevators:MainElevatorOpen1" -10 -49 50
execute if score lift hard matches 832 run structure load "lobby/elevators:MainElevatorOpen2" -10 -49 50
execute if score lift hard matches 834 run structure load "lobby/elevators:MainElevatorOpen3" -10 -49 50
execute if score lift hard matches 838 run structure load "lobby/elevators:MainElevatorOpen2" -10 -49 50
execute if score lift hard matches 840 run structure load "lobby/elevators:MainElevatorOpen3" -10 -49 50
# // begin game
execute if score lift hard matches 840 run scoreboard players set started hard 1
# // Raise elevator back to the surface
execute if score lift hard matches 850 run structure load "lobby/elevators:MainElevatorOpen3" -10 -48 50
execute if score lift hard matches 860 run structure load "lobby/elevators:MainElevatorOpen3" -10 -47 50
execute if score lift hard matches 865 run structure load "lobby:LiftBorderRemove" 5 -59 49
execute if score lift hard matches 870 run structure load "lobby/elevators:MainElevatorOpen3" -10 -46 50
execute if score lift hard matches 878 run structure load "lobby/elevators:MainElevatorOpen3" -10 -45 50
execute if score lift hard matches 885 run structure load "lobby/elevators:MainElevatorOpen3" -10 -44 50
execute if score lift hard matches 892 run structure load "lobby/elevators:MainElevatorOpen3" -10 -43 50
execute if score lift hard matches 900 run structure load "lobby/elevators:MainElevatorOpen3" -10 -42 50
execute if score lift hard matches 905 run structure load "lobby/elevators:MainElevatorOpen3" -10 -41 50
execute if score lift hard matches 910 run structure load "lobby/elevators:MainElevatorOpen3" -10 -40 50
execute if score lift hard matches 915 run structure load "lobby/elevators:MainElevatorOpen3" -10 -39 50
execute if score lift hard matches 920 run structure load "lobby/elevators:MainElevatorOpen3" -10 -38 50
execute if score lift hard matches 925 run structure load "lobby/elevators:MainElevatorOpen3" -10 -37 50
execute if score lift hard matches 930 run structure load "lobby/elevators:MainElevatorOpen3" -10 -36 50
execute if score lift hard matches 935 run structure load "lobby/elevators:MainElevatorOpen3" -10 -35 50
# // Exiting Room 1
execute if score lift hard matches 940 run structure load "lobby/elevators:MainElevatorOpen3" -10 -35 50
execute if score lift hard matches 944 run structure load "lobby/elevators:MainElevatorOpen3" -10 -34 50
execute if score lift hard matches 948 run structure load "lobby/elevators:MainElevatorOpen3" -10 -33 50
execute if score lift hard matches 952 run structure load "lobby/elevators:MainElevatorOpen3" -10 -32 50
execute if score lift hard matches 955 run structure load "lobby/elevators:MainElevatorOpen3" -10 -31 50
execute if score lift hard matches 958 run structure load "lobby/elevators:MainElevatorOpen3" -10 -30 50
execute if score lift hard matches 961 run structure load "lobby/elevators:MainElevatorOpen3" -10 -29 50
execute if score lift hard matches 964 run structure load "lobby/elevators:MainElevatorOpen3" -10 -28 50
execute if score lift hard matches 967 run structure load "lobby/elevators:MainElevatorOpen3" -10 -27 50
execute if score lift hard matches 970 run structure load "lobby/elevators:MainElevatorOpen3" -10 -26 50
execute if score lift hard matches 973 run structure load "lobby/elevators:MainElevatorOpen3" -10 -25 50
execute if score lift hard matches 976 run structure load "lobby/elevators:MainElevatorOpen3" -10 -24 50
execute if score lift hard matches 979 run structure load "lobby/elevators:MainElevatorOpen3" -10 -23 50
execute if score lift hard matches 982 run structure load "lobby/elevators:MainElevatorOpen3" -10 -22 50
execute if score lift hard matches 985 run structure load "lobby/elevators:MainElevatorOpen3" -10 -21 50
execute if score lift hard matches 988 run structure load "lobby/elevators:MainElevatorOpen3" -10 -20 50
execute if score lift hard matches 991 run structure load "lobby/elevators:MainElevatorOpen3" -10 -19 50
execute if score lift hard matches 993 run structure load "lobby/elevators:MainElevatorOpen3" -10 -18 50
execute if score lift hard matches 995 run structure load "lobby/elevators:MainElevatorOpen3" -10 -17 50
execute if score lift hard matches 997 run structure load "lobby/elevators:MainElevatorOpen3" -10 -16 50
execute if score lift hard matches 999 run structure load "lobby/elevators:MainElevatorOpen3" -10 -15 50
execute if score lift hard matches 1001 run structure load "lobby/elevators:MainElevatorOpen3" -10 -14 50
execute if score lift hard matches 1003 run structure load "lobby/elevators:MainElevatorOpen3" -10 -13 50
execute if score lift hard matches 1005 run structure load "lobby/elevators:MainElevatorOpen3" -10 -12 50
execute if score lift hard matches 1007 run structure load "lobby/elevators:MainElevatorOpen3" -10 -11 50
execute if score lift hard matches 1009 run structure load "lobby/elevators:MainElevatorOpen3" -10 -10 50
execute if score lift hard matches 1011 run structure load "lobby/elevators:MainElevatorOpen3" -10 -9 50
execute if score lift hard matches 1013 run structure load "lobby/elevators:MainElevatorOpen3" -10 -8 50
execute if score lift hard matches 1015 run structure load "lobby/elevators:MainElevatorOpen3" -10 -7 50
execute if score lift hard matches 1017 run structure load "lobby/elevators:MainElevatorOpen3" -10 -6 50
execute if score lift hard matches 1019 run structure load "lobby/elevators:MainElevatorOpen3" -10 -5 50
execute if score lift hard matches 1022 run structure load "lobby/elevators:MainElevatorOpen3" -10 -4 50
execute if score lift hard matches 1024 run structure load "lobby/elevators:MainElevatorOpen3" -10 -3 50
execute if score lift hard matches 1026 run structure load "lobby/elevators:MainElevatorOpen3" -10 -2 50
execute if score lift hard matches 1028 run structure load "lobby/elevators:MainElevatorOpen3" -10 -1 50
execute if score lift hard matches 1030 run structure load "lobby/elevators:MainElevatorOpen3" -10 0 50
execute if score lift hard matches 1032 run structure load "lobby/elevators:MainElevatorOpen3" -10 1 50
execute if score lift hard matches 1034 run structure load "lobby/elevators:MainElevatorOpen3" -10 2 50
execute if score lift hard matches 1036 run structure load "lobby/elevators:MainElevatorOpen3" -10 3 50
execute if score lift hard matches 1038 run structure load "lobby/elevators:MainElevatorOpen3" -10 4 50
execute if score lift hard matches 1040 run structure load "lobby/elevators:MainElevatorOpen3" -10 5 50
execute if score lift hard matches 1041 run structure load "lobby/elevators:MainElevatorOpen3" -10 6 50
execute if score lift hard matches 1042 run structure load "lobby/elevators:MainElevatorOpen3" -10 7 50
execute if score lift hard matches 1043 run structure load "lobby/elevators:MainElevatorOpen3" -10 8 50
execute if score lift hard matches 1044 run structure load "lobby/elevators:MainElevatorOpen3" -10 9 50
execute if score lift hard matches 1045 run structure load "lobby/elevators:MainElevatorOpen3" -10 10 50
execute if score lift hard matches 1046 run structure load "lobby/elevators:MainElevatorOpen3" -10 11 50
execute if score lift hard matches 1047 run structure load "lobby/elevators:MainElevatorOpen3" -10 12 50
execute if score lift hard matches 1048 run structure load "lobby/elevators:MainElevatorOpen3" -10 13 50
execute if score lift hard matches 1049 run structure load "lobby/elevators:MainElevatorOpen3" -10 14 50
execute if score lift hard matches 1050 run structure load "lobby/elevators:MainElevatorOpen3" -10 15 50
execute if score lift hard matches 1051 run structure load "lobby/elevators:MainElevatorOpen3" -10 16 50
execute if score lift hard matches 1052 run structure load "lobby/elevators:MainElevatorOpen3" -10 17 50
execute if score lift hard matches 1053 run structure load "lobby/elevators:MainElevatorOpen3" -10 18 50
execute if score lift hard matches 1054 run structure load "lobby/elevators:MainElevatorOpen3" -10 19 50
execute if score lift hard matches 1055 run structure load "lobby/elevators:MainElevatorOpen3" -10 20 50
# // Exiting Gamemode Shaft1
execute if score lift hard matches 1056 run structure load "lobby/elevators:MainElevatorOpen3" -10 21 50
execute if score lift hard matches 1057 run structure load "lobby/elevators:MainElevatorOpen3" -10 22 50
execute if score lift hard matches 1058 run structure load "lobby/elevators:MainElevatorOpen3" -10 23 50
execute if score lift hard matches 1059 run structure load "lobby/elevators:MainElevatorOpen3" -10 24 50
execute if score lift hard matches 1060 run structure load "lobby/elevators:MainElevatorOpen3" -10 25 50
execute if score lift hard matches 1061 run structure load "lobby/elevators:MainElevatorOpen3" -10 26 50
execute if score lift hard matches 1062 run structure load "lobby/elevators:MainElevatorOpen3" -10 27 50
execute if score lift hard matches 1063 run structure load "lobby/elevators:MainElevatorOpen3" -10 28 50
execute if score lift hard matches 1064 run structure load "lobby/elevators:MainElevatorOpen3" -10 29 50
execute if score lift hard matches 1065 run structure load "lobby/elevators:MainElevatorOpen3" -10 30 50
execute if score lift hard matches 1066 run structure load "lobby/elevators:MainElevatorOpen3" -10 31 50
execute if score lift hard matches 1067 run structure load "lobby/elevators:MainElevatorOpen3" -10 32 50
execute if score lift hard matches 1068 run structure load "lobby/elevators:MainElevatorOpen3" -10 33 50
execute if score lift hard matches 1069 run structure load "lobby/elevators:MainElevatorOpen3" -10 34 50
execute if score lift hard matches 1070 run structure load "lobby/elevators:MainElevatorOpen3" -10 35 50
execute if score lift hard matches 1071 run structure load "lobby/elevators:MainElevatorOpen3" -10 36 50
execute if score lift hard matches 1072 run structure load "lobby/elevators:MainElevatorOpen3" -10 37 50
execute if score lift hard matches 1073 run structure load "lobby/elevators:MainElevatorOpen3" -10 38 50
execute if score lift hard matches 1074 run structure load "lobby/elevators:MainElevatorOpen3" -10 39 50
execute if score lift hard matches 1075 run structure load "lobby/elevators:MainElevatorOpen3" -10 40 50
execute if score lift hard matches 1076 run structure load "lobby/elevators:MainElevatorOpen3" -10 41 50
execute if score lift hard matches 1077 run structure load "lobby/elevators:MainElevatorOpen3" -10 42 50
execute if score lift hard matches 1078 run structure load "lobby/elevators:MainElevatorOpen3" -10 43 50
execute if score lift hard matches 1079 run structure load "lobby/elevators:MainElevatorOpen3" -10 44 50
execute if score lift hard matches 1080 run structure load "lobby/elevators:MainElevatorOpen3" -10 45 50
execute if score lift hard matches 1081 run structure load "lobby/elevators:MainElevatorOpen3" -10 46 50
execute if score lift hard matches 1082 run structure load "lobby/elevators:MainElevatorOpen3" -10 47 50
execute if score lift hard matches 1083 run structure load "lobby/elevators:MainElevatorOpen3" -10 48 50
execute if score lift hard matches 1084 run structure load "lobby/elevators:MainElevatorOpen3" -10 49 50
execute if score lift hard matches 1085 run structure load "lobby/elevators:MainElevatorOpen3" -10 50 50
execute if score lift hard matches 1087 run structure load "lobby/elevators:MainElevatorOpen3" -10 51 50
execute if score lift hard matches 1089 run structure load "lobby/elevators:MainElevatorOpen3" -10 52 50
execute if score lift hard matches 1091 run structure load "lobby/elevators:MainElevatorOpen3" -10 53 50
execute if score lift hard matches 1093 run structure load "lobby/elevators:MainElevatorOpen3" -10 54 50
execute if score lift hard matches 1095 run structure load "lobby/elevators:MainElevatorOpen3" -10 55 50
execute if score lift hard matches 1097 run structure load "lobby/elevators:MainElevatorOpen3" -10 56 50
execute if score lift hard matches 1099 run structure load "lobby/elevators:MainElevatorOpen3" -10 57 50
execute if score lift hard matches 1102 run structure load "lobby/elevators:MainElevatorOpen3" -10 58 50
execute if score lift hard matches 1105 run structure load "lobby/elevators:MainElevatorOpen3" -10 59 50
execute if score lift hard matches 1108 run structure load "lobby/elevators:MainElevatorOpen3" -10 60 50
execute if score lift hard matches 1111 run structure load "lobby/elevators:MainElevatorOpen3" -10 61 50
execute if score lift hard matches 1114 run structure load "lobby/elevators:MainElevatorOpen3" -10 62 50
execute if score lift hard matches 1117 run structure load "lobby/elevators:MainElevatorOpen3" -10 63 50
execute if score lift hard matches 1120 run structure load "lobby/elevators:MainElevatorOpen3" -10 64 50
execute if score lift hard matches 1123 run structure load "lobby/elevators:MainElevatorOpen3" -10 65 50
execute if score lift hard matches 1126 run structure load "lobby/elevators:MainElevatorOpen3" -10 66 50
execute if score lift hard matches 1129 run structure load "lobby/elevators:MainElevatorOpen3" -10 67 50
execute if score lift hard matches 1142 run structure load "lobby/elevators:MainElevatorOpen3" -10 68 50
execute if score lift hard matches 1146 run structure load "lobby/elevators:MainElevatorOpen3" -10 69 50
execute if score lift hard matches 1150 run structure load "lobby/elevators:MainElevatorOpen3" -10 70 50
execute if score lift hard matches 1154 run structure load "lobby/elevators:MainElevatorOpen3" -10 71 50
execute if score lift hard matches 1158 run structure load "lobby/elevators:MainElevatorOpen3" -10 72 50
execute if score lift hard matches 1162 run structure load "lobby/elevators:MainElevatorOpen3" -10 73 50
execute if score lift hard matches 1166 run structure load "lobby/elevators:MainElevatorOpen3" -10 74 50
execute if score lift hard matches 1170 run structure load "lobby/elevators:MainElevatorOpen3" -10 75 50
execute if score lift hard matches 1174 run structure load "lobby/elevators:MainElevatorOpen3" -10 76 50
execute if score lift hard matches 1178 run structure load "lobby/elevators:MainElevatorOpen3" -10 77 50
execute if score lift hard matches 1182 run structure load "lobby/elevators:MainElevatorOpen3" -10 78 50
execute if score lift hard matches 1186 run structure load "lobby/elevators:MainElevatorOpen3" -10 79 50
execute if score lift hard matches 1191 run structure load "lobby/elevators:MainElevatorOpen3" -10 80 50
execute if score lift hard matches 1198 run structure load "lobby/elevators:MainElevatorOpen3" -10 81 50
execute if score lift hard matches 1204 run structure load "lobby/elevators:MainElevatorOpen3" -10 82 50
execute if score lift hard matches 1213 run structure load "lobby/elevators:MainElevatorOpen3" -10 83 50
# // Close the Elevator
execute if score lift hard matches 1220 run structure load "lobby/elevators:MainElevatorOpen2" -10 83 50
execute if score lift hard matches 1230 run structure load "lobby/elevators:MainElevatorOpen1" -10 83 50
execute if score lift hard matches 1240 run structure load "lobby/elevators:MainElevator" -10 87 50
# = OTHER THINGS =
# // Silo door open
execute if score lift hard matches 607 run structure load "lobby/doors:SiloDoor2" -10 -36 47
execute if score lift hard matches 664 run structure load "lobby/doors:SiloDoor3" -10 -36 47
execute if score lift hard matches 704 run structure load "lobby/doors:SiloDoor4" -10 -36 47
# // Silo door close
execute if score lift hard matches 944 run structure load "lobby/doors:SiloDoor3" -10 -36 47
execute if score lift hard matches 974 run structure load "lobby/doors:SiloDoor2" -10 -36 47
execute if score lift hard matches 1004 run structure load "lobby/doors:SiloDoor1" -10 -36 47
# = ALARM EFFECT =
execute if score alarm hard matches 1 unless score lift hard matches 320..550 run structure load "hard:HardStateLower1" -11 93 49
execute if score alarm hard matches 4 unless score lift hard matches 320..550 run structure load "hard:HardStateLower2" -11 93 49
execute if score alarm hard matches 7 unless score lift hard matches 320..550 run structure load "hard:HardStateLower3" -11 93 49
execute if score alarm hard matches 10 unless score lift hard matches 320..550 run structure load "hard:HardStateLower4" -11 93 49
execute if score alarm hard matches 13.. unless score lift hard matches 320..550 run scoreboard players set alarm hard 0
# // change elevator status
execute if score lift hard matches 1255 run scoreboard players set start hard 2
execute if score lift hard matches 1255 run structure load "hard:HardStateBusy" -11 93 49
execute if score lift hard matches 1255 if score p_game hard matches 0 run scoreboard players set reset hard 1
execute if score lift hard matches 1255 run scoreboard players set lift hard 0
# = RESET =
execute if score reset hard matches 1 if score p_game hard matches 0 if score lift hard matches -40 if score start hard matches 2 run function game_functions/mode_hard/reset