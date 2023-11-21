 
 { 
     std::vector<int> tmp;   
     vec.swap(tmp); 
  }//使用一个局部变量空的容器temp，与vec交换，退出temp作用域后，temp会释放自己的空间，而此时vec已经是空的容器    

  list的成员函数erase、remove和clear都会自动调用元素各自的析构函数，所以如果元素是自己定义的类，并且有完善的析构函数，则直接删除即可。这类链式存储，一个元素一个元素递增空间的结构，这些函数可以真正地改变list占用的内存大小。