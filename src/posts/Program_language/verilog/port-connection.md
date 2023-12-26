---
category: 
- Verilog
---


# 四选一多路选择器

1.使用assign 语句实现

```verilog
`timescale 1ns/1ns
module mux4_1(
input [1:0]d1,d2,d3,d0,
input [1:0]sel,
output[1:0]mux_out
);

assign mux_out = (sel == 'b00) ? d3:
                 (sel == 'b01) ? d2:
                 (sel == 'b10) ? d1:
                 d0;
                 
endmodule
```

2.使用if-else实现

注意wire不能通过if-else的方式处理，因此首先需要赋给一个register, 再将该register连线至输出。

```verilog
`timescale 1ns/1ns
module mux4_1(
input [1:0]d1,d2,d3,d0,
input [1:0]sel,
output[1:0]mux_out
);
reg [1:0] x;
always @ (*)
begin
    if(sel == 2'b11) x = d0;
    else if(sel == 2'b10) x = d1;
    else if(sel == 2'b01) x = d2;
    else x = d3;
end
assign mux_out = x;
endmodule
```