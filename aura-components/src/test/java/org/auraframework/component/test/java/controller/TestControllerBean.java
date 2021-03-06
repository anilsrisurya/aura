/*
 * Copyright (C) 2013 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.auraframework.component.test.java.controller;

import org.auraframework.system.Annotations.AuraEnabled;
import org.auraframework.system.Annotations.Controller;
import org.auraframework.system.Annotations.Key;

@Controller(useAdapter=true)
public class TestControllerBean {
	private int counter = -1;
	boolean debug=false;
	
	public TestControllerBean() {
		this.counter=0;
		if(debug) System.out.println("create TestControllerBean#"+this.hashCode());
    }
	
	@AuraEnabled
    public int increaseCounter() {
		this.counter++;
		if(debug) System.out.println("increaseCounter of TestControllerBean#"+this.hashCode()+":"+this.counter);
		return this.counter;
    } 
	
	@AuraEnabled
    public int decreaseCounter() {
		this.counter--;
		if(debug) System.out.println("decrease of TestControllerBean#"+this.hashCode()+":"+this.counter);
		return this.counter;
    }
	
	@AuraEnabled
    public void setCounter(@Key("value") int value) {
		this.counter = value;
		if(debug) System.out.println("setCounter of TestControllerBean#"+this.hashCode()+" to "+value);
	}
	
	@AuraEnabled
    public int getCounter() {
		if(debug) System.out.println("getCounter of TestControllerBean#"+this.hashCode()+":"+this.counter);
		return this.counter;
	}
	
}
