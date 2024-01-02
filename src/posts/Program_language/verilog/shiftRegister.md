---
category: 
- Verilog
---


# 移位寄存器简介

移位寄存器内的数据可以在**移位脉冲**（时钟信号）的作用下依次左移或右移。移位寄存器不仅可以存储数据，还可以用来实现数据的串并转换、分频，构成序列码发生器、序列码检测器，进行数值运算以及数据处理等，它也是数字系统中应用非常广泛的时序逻辑部件之一。

4位右移位寄存器工作原理:

${Q}^{n+1}_{A}= {Q}^{n}_{I}$

${Q}^{n+1}_{B}= {Q}^{n}_{A}$

${Q}^{n+1}_{C}= {Q}^{n}_{B}$

${Q}^{n+1}_{D}= {Q}^{n}_{C}$


```verilog
module register_right (clk, din, dout);
    input clk;
    input [15:0] din;
    output [15:0] dout;
    reg [15:0] dout;
    // reg [15:0] dout;
    always @(posedge clk) begin
        dout <= {din[0], din[15:1]};
    end
    
endmodule
```


```verilog
`timescale 1ns/1ps

module register_right_tb;
    reg clk;
    reg [15:0] din;
    wire [15:0] dout;

    initial begin
        $dumpfile("wave.vcd");
        $dumpvars(0, register_right_tb);
    end

    initial begin
        clk = 1'b0;
        din = 16'b0000_0000_0000_0000;
        #10 din = 16'b1000_0000_0000_0000;
        #20 din = 16'b0100_0000_0000_0000;
        #1000 $stop;
    end

    always #10 clk = ~clk;
    
    register_right U1(.clk(clk), .din(din), .dout(dout));

endmodule
```


循环移位寄存器

```verilog
`timescale 1ns / 1ps

module cycle_left_register #(parameter MSB = 4)(
	input [MSB - 1 : 0] din,
	input i_rst,
	input i_load,
	input i_clk,
	output  [MSB - 1 : 0] dout
    );

	reg [MSB - 1 : 0] dout_mid;
	always@(posedge i_clk) begin
		if(i_rst) begin
			dout_mid <= 'd0;
		end
		else if(i_load) begin
			dout_mid <= din;
		end
		else begin
			dout_mid <= {dout_mid[MSB - 2 : 0], dout_mid[MSB - 1]};
		end
	end
	assign dout = dout_mid;


endmodule
```


```verilog
`timescale 1ns / 1ps


module cycle_left_register_tb(

    );
	parameter MSB = 4;

	reg [MSB - 1 : 0] din;
	reg i_rst;
	reg i_clk;
	reg i_load;
	wire [MSB - 1 : 0] dout;

	//generate clock
	initial begin
		i_clk = 0;
		forever begin
			#5 i_clk = ~i_clk;
		end
	end

	//generate rst and input data 
	initial begin
		i_rst = 1;
		din = 0;
		i_load = 0;

		# 22

		i_rst = 0;
		@(negedge i_clk) begin
		din = 'b1011;
		i_load = 1;
		end

		@(negedge i_clk) begin
			i_load = 0;
		end

		repeat(5) @(posedge i_clk);

		@(negedge i_clk) begin
			din = 'd0101;
			i_load = 1;
		end
		
		@(negedge i_clk) i_load = 0;

		repeat(4) @(posedge i_clk);

		#10 $finish;

	end

	initial
      $monitor (" i_rst = %0b, i_load = %0b, din = %b, dout = %b", i_rst, i_load, din, dout);
initial
begin            
    $dumpfile("wave.vcd");        //生成的vcd文件名称
    $dumpvars(0, cycle_left_register_tb);    //tb模块名称
end

	cycle_left_register #(.MSB(MSB))inst_cycle_left_register(
		.i_clk(i_clk),
		.i_rst(i_rst),
		.i_load(i_load),
		.din(din),
		.dout(dout)
		);


endmodule
```